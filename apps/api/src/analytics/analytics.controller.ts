import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RoutineHistoryResponse } from '@symma/shared-types';

@Controller('routines')
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id/stats')
  async getRoutineStats(@Param('id') id: string) {
    const routine = await this.prisma.routine.findUnique({
      where: { id },
    });

    if (!routine) {
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }

    // Aggregate sessions
    const sessions = await this.prisma.session.findMany({
      where: { routineId: id },
      orderBy: { date: 'asc' },
    });

    const totalSessions = sessions.length;
    const avgScore =
      totalSessions > 0
        ? sessions.reduce((sum, s) => sum + s.score, 0) / totalSessions
        : 0;

    // Calculate Streak (consecutive days ending yesterday or today)
    let currentStreak = 0;
    // Logic for streak to be improved later, for now simplified count of sessions in last days
    // A proper streak needs consecutive dates.
    // Let's assume one session per day for simplicity or grouping by day.

    // Simple streak logic:
    // Sort descending. Check difference in days.
    const sortedSessions = [...sessions].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
    if (sortedSessions.length > 0) {
      // Check if last session was today or yesterday
      const lastSessionDate = sortedSessions[0].date;
      const today = new Date();
      const diffIds = Math.floor(
        (today.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffIds <= 1) {
        currentStreak = 1;
        for (let i = 0; i < sortedSessions.length - 1; i++) {
          const d1 = sortedSessions[i].date;
          const d2 = sortedSessions[i + 1].date;
          const diffDays = Math.floor(
            (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (diffDays === 1) {
            currentStreak++;
          } else if (diffDays === 0) {
            // Same day, continue
            continue;
          } else {
            break;
          }
        }
      }
    }

    const chartData = sessions.map((s) => ({
      date: s.date.toISOString().split('T')[0], // YYYY-MM-DD
      score: Math.round(s.score * 100), // Convert 0.9 to 90
    }));

    return {
      summary: {
        totalSessions,
        currentStreak,
        avgScore: Math.round(avgScore * 100), // Return percentage
      },
      chartData,
    };
  }

  @Get(':id/history')
  async getRoutineHistory(
    @Param('id') id: string,
  ): Promise<RoutineHistoryResponse> {
    const routine = await this.prisma.routine.findUnique({
      where: { id },
    });

    if (!routine) {
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }

    const sessions = await this.prisma.session.findMany({
      where: { routineId: id },
      orderBy: { date: 'desc' },
      take: 20,
      include: {
        items: {
          select: {
            exerciseId: true,
            repsCompleted: true,
            averageAccuracy: true,
            exercise: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      date: session.date.toISOString(),
      durationSeconds: session.durationSeconds,
      score: Math.round(session.score * 100),
      isSynced: session.isSynced,
      items: session.items.map((item) => ({
        exerciseId: item.exerciseId,
        exerciseName: item.exercise.name,
        repsCompleted: item.repsCompleted,
        averageAccuracy: item.averageAccuracy,
      })),
    }));
  }
}
