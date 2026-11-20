import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  PatientStatsResponse,
  RoutineHistoryResponse,
  RoutineStatsResponse,
} from '@symma/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import {
  addDays,
  CalendarDay,
  calendarDayIn,
  currentStreak,
  daysBetween,
  utcCalendarDay,
} from './calendar-days';

export const ADHERENCE_WINDOW_DAYS = 30;
const DEFAULT_TIME_ZONE = 'UTC';

interface RoutinePeriod {
  id: string;
  startDate: Date;
  endDate: Date | null;
}

@Injectable()
export class AnalyticsService {
  private readonly timeZone: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.timeZone =
      configService.get<string>('ANALYTICS_TIME_ZONE') || DEFAULT_TIME_ZONE;
  }

  async getRoutineStats(
    therapistId: string,
    routineId: string,
  ): Promise<RoutineStatsResponse> {
    await this.assertRoutineOwnedBy(therapistId, routineId);
    const ofRoutine = { session: { routineId } };

    const [summary, sessions, symmetryBySession, symmetry, practicedDays] =
      await Promise.all([
        this.prisma.session.aggregate({
          where: { routineId },
          _count: { _all: true },
          _avg: { score: true },
        }),
        this.prisma.session.findMany({
          where: { routineId },
          orderBy: [{ date: 'asc' }, { id: 'asc' }],
          select: { id: true, date: true, score: true },
        }),
        this.prisma.sessionItem.groupBy({
          by: ['sessionId'],
          where: ofRoutine,
          _avg: { symmetryScore: true },
        }),
        this.prisma.sessionItem.aggregate({
          where: ofRoutine,
          _avg: { symmetryScore: true },
        }),
        this.practicedDays(routineId),
      ]);

    const symmetryOf = new Map(
      symmetryBySession.map(({ sessionId, _avg }) => [
        sessionId,
        _avg.symmetryScore,
      ]),
    );

    return {
      summary: {
        totalSessions: summary._count._all,
        currentStreak: currentStreak(practicedDays, this.today()),
        avgScore: Math.round(summary._avg.score ?? 0),
      },
      averageSymmetry: roundOrNull(symmetry._avg.symmetryScore),
      chartData: sessions.map((session) => ({
        date: calendarDayIn(this.timeZone, session.date),
        score: Math.round(session.score),
        symmetry: roundOrNull(symmetryOf.get(session.id)),
      })),
    };
  }

  async getRoutineHistory(
    therapistId: string,
    routineId: string,
    { page = 1, limit = 20 }: { page?: number; limit?: number },
  ): Promise<RoutineHistoryResponse> {
    await this.assertRoutineOwnedBy(therapistId, routineId);

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where: { routineId },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: {
            select: {
              exerciseId: true,
              repsCompleted: true,
              averageAccuracy: true,
              symmetryScore: true,
              averageHoldSeconds: true,
              exercise: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.session.count({ where: { routineId } }),
    ]);

    return {
      data: sessions.map((session) => ({
        id: session.id,
        date: session.date.toISOString(),
        durationSeconds: session.durationSeconds,
        score: Math.round(session.score),
        isSynced: session.isSynced,
        items: session.items.map(({ exercise, ...item }) => ({
          ...item,
          exerciseName: exercise.name,
        })),
      })),
      total,
      page,
      limit,
    };
  }

  async getPatientStats(
    therapistId: string,
    patientId: string,
  ): Promise<PatientStatsResponse> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, therapistId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('errors.patients.notFound');
    }

    const [sessions, activeRoutine] = await Promise.all([
      this.prisma.session.aggregate({
        where: { routine: { patientId } },
        _count: { _all: true },
        _max: { date: true },
      }),
      this.prisma.routine.findFirst({
        where: { patientId, status: 'ACTIVE' },
        select: { id: true, startDate: true, endDate: true },
      }),
    ]);

    return {
      adherencePercent: activeRoutine
        ? await this.adherencePercent(activeRoutine)
        : null,
      sessionsCompleted: sessions._count._all,
      lastSessionAt: sessions._max.date?.toISOString() ?? null,
    };
  }

  private async assertRoutineOwnedBy(
    therapistId: string,
    routineId: string,
  ): Promise<void> {
    const routine = await this.prisma.routine.findFirst({
      where: { id: routineId, patient: { therapistId } },
      select: { id: true },
    });

    if (!routine) {
      throw new NotFoundException('errors.routines.notFound');
    }
  }

  /**
   * Share of calendar days with at least one session over the last
   * ADHERENCE_WINDOW_DAYS days of the routine's prescribed period.
   */
  private async adherencePercent(
    routine: RoutinePeriod,
  ): Promise<number | null> {
    const today = this.today();
    const routineEnd = routine.endDate
      ? utcCalendarDay(routine.endDate)
      : today;
    const windowEnd = routineEnd < today ? routineEnd : today;
    const earliestWindowStart = addDays(windowEnd, 1 - ADHERENCE_WINDOW_DAYS);
    const routineStart = utcCalendarDay(routine.startDate);
    const windowStart =
      routineStart > earliestWindowStart ? routineStart : earliestWindowStart;

    if (windowStart > windowEnd) {
      return null;
    }

    const practiced = (await this.practicedDays(routine.id)).filter(
      (day) => day >= windowStart && day <= windowEnd,
    );
    const windowDays = daysBetween(windowStart, windowEnd) + 1;
    return Math.round((practiced.length / windowDays) * 100);
  }

  private async practicedDays(routineId: string): Promise<CalendarDay[]> {
    const rows = await this.prisma.$queryRaw<{ day: string }[]>`
      SELECT DISTINCT to_char(("date" AT TIME ZONE 'UTC') AT TIME ZONE ${this.timeZone}, 'YYYY-MM-DD') AS day
      FROM "sessions"
      WHERE "routine_id" = ${routineId}
    `;
    return rows.map(({ day }) => day);
  }

  private today(): CalendarDay {
    return calendarDayIn(this.timeZone, new Date());
  }
}

function roundOrNull(value: number | null | undefined): number | null {
  return value === null || value === undefined ? null : Math.round(value);
}
