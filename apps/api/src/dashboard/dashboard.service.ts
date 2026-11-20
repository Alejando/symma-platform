import { Injectable } from '@nestjs/common';
import type {
  AtRiskPatientResponse,
  DashboardStatsResponse,
} from '@symma/shared-types';
import { PrismaService } from '../prisma/prisma.service';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
export const AT_RISK_INACTIVITY_DAYS = 3;
export const EFFICACY_WINDOW_DAYS = 7;

interface AtRiskCandidate {
  id: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(therapistId: string): Promise<DashboardStatsResponse> {
    const now = new Date();
    const inactivityThreshold = daysBefore(now, AT_RISK_INACTIVITY_DAYS);

    const [activePatients, atRiskCandidates, efficacy] = await Promise.all([
      this.prisma.patient.count({ where: { therapistId, status: 'ACTIVE' } }),
      this.prisma.patient.findMany({
        where: {
          therapistId,
          status: 'ACTIVE',
          routines: {
            some: {
              status: 'ACTIVE',
              OR: [{ endDate: { gt: now } }, { endDate: null }],
            },
          },
          NOT: {
            routines: {
              some: {
                sessions: { some: { date: { gt: inactivityThreshold } } },
              },
            },
          },
        },
        select: { id: true, firstName: true, lastName: true },
      }),
      this.prisma.session.aggregate({
        where: {
          date: { gt: daysBefore(now, EFFICACY_WINDOW_DAYS) },
          routine: { patient: { therapistId } },
        },
        _avg: { score: true },
      }),
    ]);

    const atRiskPatients = await this.describeInactivity(atRiskCandidates, now);

    return {
      metrics: {
        activePatients: { value: activePatients, trend: 0 },
        complianceAlerts: { value: atRiskPatients.length, trend: 0 },
        avgEfficacy: { value: Math.round(efficacy._avg.score ?? 0), trend: 0 },
      },
      atRiskPatients,
    };
  }

  private async describeInactivity(
    candidates: AtRiskCandidate[],
    now: Date,
  ): Promise<AtRiskPatientResponse[]> {
    if (candidates.length === 0) {
      return [];
    }

    const routines = await this.prisma.routine.findMany({
      where: { patientId: { in: candidates.map(({ id }) => id) } },
      select: { id: true, patientId: true, status: true, startDate: true },
    });
    const lastSessionByRoutine = await this.prisma.session.groupBy({
      by: ['routineId'],
      where: { routineId: { in: routines.map(({ id }) => id) } },
      _max: { date: true },
    });

    const lastSessionAt = new Map<string, Date>();
    const firstActiveStart = new Map<string, Date>();
    const patientOfRoutine = new Map(
      routines.map(({ id, patientId }) => [id, patientId]),
    );

    for (const { routineId, _max } of lastSessionByRoutine) {
      const patientId = patientOfRoutine.get(routineId);
      const previous = patientId ? lastSessionAt.get(patientId) : undefined;
      if (patientId && _max.date && (!previous || _max.date > previous)) {
        lastSessionAt.set(patientId, _max.date);
      }
    }

    for (const { patientId, status, startDate } of routines) {
      const previous = firstActiveStart.get(patientId);
      if (status === 'ACTIVE' && (!previous || startDate < previous)) {
        firstActiveStart.set(patientId, startDate);
      }
    }

    return candidates
      .map(({ id, firstName, lastName }) => {
        const inactiveSince =
          lastSessionAt.get(id) ?? firstActiveStart.get(id) ?? now;
        return {
          id,
          name: `${firstName} ${lastName}`,
          daysInactive:
            wholeDaysBetween(inactiveSince, now) || AT_RISK_INACTIVITY_DAYS,
        };
      })
      .sort((a, b) => b.daysInactive - a.daysInactive);
  }
}

function daysBefore(instant: Date, days: number): Date {
  return new Date(instant.getTime() - days * MILLISECONDS_PER_DAY);
}

function wholeDaysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MILLISECONDS_PER_DAY);
}
