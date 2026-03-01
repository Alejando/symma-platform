import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  const mockPrismaService = {
    routine: {
      findUnique: jest.fn(),
    },
    session: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRoutineStats', () => {
    it('should return stats for a valid routine', async () => {
      const routineId = 'test-routine-1';
      mockPrismaService.routine.findUnique.mockResolvedValue({ id: routineId });

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const sessions = [
        { date: yesterday, score: 0.5 },
        { date: today, score: 0.8 },
      ];
      mockPrismaService.session.findMany.mockResolvedValue(sessions);

      const result = await controller.getRoutineStats(routineId);

      expect(result.summary.totalSessions).toBe(2);
      expect(result.summary.avgScore).toBe(65); // (50+80)/2
      expect(result.summary.currentStreak).toBe(2);
      expect(result.chartData).toHaveLength(2);
      expect(result.chartData[0].score).toBe(50);
      expect(result.chartData[1].score).toBe(80);
    });

    it('should throw NotFoundException if routine does not exist', async () => {
      mockPrismaService.routine.findUnique.mockResolvedValue(null);

      await expect(controller.getRoutineStats('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return 0 stats for empty sessions', async () => {
      const routineId = 'test-empty';
      mockPrismaService.routine.findUnique.mockResolvedValue({ id: routineId });
      mockPrismaService.session.findMany.mockResolvedValue([]);

      const result = await controller.getRoutineStats(routineId);

      expect(result.summary.totalSessions).toBe(0);
      expect(result.summary.avgScore).toBe(0);
      expect(result.summary.currentStreak).toBe(0);
      expect(result.chartData).toHaveLength(0);
    });
  });

  describe('getRoutineHistory', () => {
    it('should return enriched history with item summaries', async () => {
      const routineId = 'routine-history-1';
      mockPrismaService.routine.findUnique.mockResolvedValue({ id: routineId });
      mockPrismaService.session.findMany.mockResolvedValue([
        {
          id: 'session-1',
          date: new Date('2026-02-22T10:00:00.000Z'),
          durationSeconds: 900,
          score: 0.85,
          isSynced: true,
          items: [
            { exerciseId: 'exercise-1', averageAccuracy: 88.5 },
            { exerciseId: 'exercise-2', averageAccuracy: null },
          ],
        },
      ]);

      const result = await controller.getRoutineHistory(routineId);

      expect(mockPrismaService.session.findMany).toHaveBeenCalledWith({
        where: { routineId },
        orderBy: { date: 'desc' },
        take: 20,
        include: {
          items: {
            select: {
              exerciseId: true,
              averageAccuracy: true,
            },
          },
        },
      });
      expect(result).toEqual([
        {
          id: 'session-1',
          date: '2026-02-22T10:00:00.000Z',
          durationSeconds: 900,
          score: 85,
          isSynced: true,
          items: [
            { exerciseId: 'exercise-1', averageAccuracy: 88.5 },
            { exerciseId: 'exercise-2', averageAccuracy: null },
          ],
        },
      ]);
    });

    it('should throw NotFoundException if routine does not exist', async () => {
      mockPrismaService.routine.findUnique.mockResolvedValue(null);

      await expect(controller.getRoutineHistory('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
