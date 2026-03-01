import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(therapistId: string) {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [activePatientsCount, atRiskPatients, recentSessions] =
      await Promise.all([
        // 1. Active Patients Count
        this.prisma.patient.count({
          where: {
            therapistId,
            status: 'ACTIVE',
          },
        }),

        // 2. At Risk Patients Candidates
        // Find patients with active routines who haven't practiced in 3 days
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
            // NOT: Has any session in the last 3 days
            NOT: {
              routines: {
                some: {
                  sessions: {
                    some: {
                      date: { gt: threeDaysAgo },
                    },
                  },
                },
              },
            },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        }),

        // 3. Avg Efficacy (Last 7 days)
        this.prisma.session.findMany({
          where: {
            date: { gt: sevenDaysAgo },
            routine: {
              patient: {
                therapistId,
              },
            },
          },
          select: {
            score: true,
          },
        }),
      ]);

    // Calculate days inactive for at-risk patients
    // We need to fetch the last session date for each at-risk patient to be precise
    const atRiskDetails = await Promise.all(
      atRiskPatients.map(async (p) => {
        const lastSession = await this.prisma.session.findFirst({
          where: { routine: { patientId: p.id } },
          orderBy: { date: 'desc' },
        });

        let daysInactive = 0;
        if (lastSession) {
          daysInactive = Math.floor(
            (now.getTime() - lastSession.date.getTime()) / (1000 * 3600 * 24),
          );
        } else {
          // If no sessions ever, use the oldest active routine start date?
          // Or just default to "3+"
          // Let's just say 4 as a placeholder or calculate from routine start
          const firstRoutine = await this.prisma.routine.findFirst({
            where: { patientId: p.id, status: 'ACTIVE' },
            orderBy: { startDate: 'asc' },
          });
          if (firstRoutine) {
            daysInactive = Math.floor(
              (now.getTime() - firstRoutine.startDate.getTime()) /
                (1000 * 3600 * 24),
            );
          }
        }

        return {
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          daysInactive: daysInactive || 3, // At least 3 by definition of the query
          avatarUrl: p.avatarUrl,
        };
      }),
    );

    // Sort by most inactive
    atRiskDetails.sort((a, b) => b.daysInactive - a.daysInactive);

    // Calculate Average Efficacy
    const scores = recentSessions.map((s) => s.score);
    const avgEfficacy =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return {
      metrics: {
        activePatients: { value: activePatientsCount, trend: 0 }, // Trend logic omitted for v1
        complianceAlerts: { value: atRiskDetails.length, trend: 0 },
        avgEfficacy: { value: Math.round(avgEfficacy), trend: 0 },
      },
      atRiskPatients: atRiskDetails,
    };
  }
}
