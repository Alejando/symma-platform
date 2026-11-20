import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const prisma = {
    routine: { findFirst: jest.fn() },
    patient: { findFirst: jest.fn() },
    session: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    sessionItem: { groupBy: jest.fn(), aggregate: jest.fn() },
    $queryRaw: jest.fn(),
  };

  const practicedDays = (...days: string[]) =>
    prisma.$queryRaw.mockResolvedValue(days.map((day) => ({ day })));

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: new Date('2026-03-10T15:00:00Z') });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: () => 'UTC' } },
      ],
    }).compile();

    service = module.get(AnalyticsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getRoutineStats', () => {
    it('reads the 0–100 scale as stored and aggregates symmetry per session', async () => {
      prisma.routine.findFirst.mockResolvedValue({ id: 'routine-1' });
      prisma.session.aggregate.mockResolvedValue({
        _count: { _all: 2 },
        _avg: { score: 64.6 },
      });
      prisma.session.findMany.mockResolvedValue([
        { id: 's1', date: new Date('2026-03-09T10:00:00Z'), score: 50.2 },
        { id: 's2', date: new Date('2026-03-10T10:00:00Z'), score: 79 },
      ]);
      prisma.sessionItem.groupBy.mockResolvedValue([
        { sessionId: 's2', _avg: { symmetryScore: 88.4 } },
      ]);
      prisma.sessionItem.aggregate.mockResolvedValue({
        _avg: { symmetryScore: 88.4 },
      });
      practicedDays('2026-03-09', '2026-03-10');

      const result = await service.getRoutineStats('therapist-1', 'routine-1');

      expect(result).toEqual({
        summary: { totalSessions: 2, currentStreak: 2, avgScore: 65 },
        averageSymmetry: 88,
        chartData: [
          { date: '2026-03-09', score: 50, symmetry: null },
          { date: '2026-03-10', score: 79, symmetry: 88 },
        ],
      });
      expect(prisma.session.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({ _avg: { score: true } }),
      );
    });

    it('returns zeros and null symmetry without sessions', async () => {
      prisma.routine.findFirst.mockResolvedValue({ id: 'routine-1' });
      prisma.session.aggregate.mockResolvedValue({
        _count: { _all: 0 },
        _avg: { score: null },
      });
      prisma.session.findMany.mockResolvedValue([]);
      prisma.sessionItem.groupBy.mockResolvedValue([]);
      prisma.sessionItem.aggregate.mockResolvedValue({
        _avg: { symmetryScore: null },
      });
      practicedDays();

      const result = await service.getRoutineStats('therapist-1', 'routine-1');

      expect(result).toEqual({
        summary: { totalSessions: 0, currentStreak: 0, avgScore: 0 },
        averageSymmetry: null,
        chartData: [],
      });
    });

    it("answers NotFound for another therapist's routine", async () => {
      prisma.routine.findFirst.mockResolvedValue(null);

      await expect(
        service.getRoutineStats('therapist-2', 'routine-1'),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.routine.findFirst).toHaveBeenCalledWith({
        where: { id: 'routine-1', patient: { therapistId: 'therapist-2' } },
        select: { id: true },
      });
    });
  });

  describe('getRoutineHistory', () => {
    it('returns the requested page, newest first, with every item metric', async () => {
      prisma.routine.findFirst.mockResolvedValue({ id: 'routine-1' });
      prisma.session.findMany.mockResolvedValue([
        {
          id: 'session-1',
          date: new Date('2026-02-22T10:00:00.000Z'),
          durationSeconds: 900,
          score: 85.4,
          isSynced: true,
          items: [
            {
              exerciseId: 'exercise-1',
              repsCompleted: 10,
              averageAccuracy: 88.5,
              symmetryScore: 91,
              averageHoldSeconds: 2.5,
              exercise: { name: 'Smile Stretch' },
            },
          ],
        },
      ]);
      prisma.session.count.mockResolvedValue(41);

      const result = await service.getRoutineHistory(
        'therapist-1',
        'routine-1',
        {
          page: 3,
          limit: 20,
        },
      );

      expect(prisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ date: 'desc' }, { id: 'desc' }],
          skip: 40,
          take: 20,
        }),
      );
      expect(result).toEqual({
        data: [
          {
            id: 'session-1',
            date: '2026-02-22T10:00:00.000Z',
            durationSeconds: 900,
            score: 85,
            isSynced: true,
            items: [
              {
                exerciseId: 'exercise-1',
                exerciseName: 'Smile Stretch',
                repsCompleted: 10,
                averageAccuracy: 88.5,
                symmetryScore: 91,
                averageHoldSeconds: 2.5,
              },
            ],
          },
        ],
        total: 41,
        page: 3,
        limit: 20,
      });
    });
  });

  describe('getPatientStats', () => {
    beforeEach(() => {
      prisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
      prisma.session.aggregate.mockResolvedValue({
        _count: { _all: 7 },
        _max: { date: new Date('2026-03-09T10:00:00Z') },
      });
    });

    it('measures adherence over the active routine days so far', async () => {
      prisma.routine.findFirst.mockResolvedValue({
        id: 'routine-1',
        startDate: new Date('2026-03-01T00:00:00Z'),
        endDate: null,
      });
      practicedDays('2026-03-01', '2026-03-04', '2026-03-09', '2026-02-20');

      const result = await service.getPatientStats('therapist-1', 'patient-1');

      expect(result).toEqual({
        adherencePercent: 30,
        sessionsCompleted: 7,
        lastSessionAt: '2026-03-09T10:00:00.000Z',
      });
    });

    it('limits the window to the last 30 days', async () => {
      prisma.routine.findFirst.mockResolvedValue({
        id: 'routine-1',
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: null,
      });
      practicedDays('2026-02-08', '2026-02-09', '2026-03-10');

      const result = await service.getPatientStats('therapist-1', 'patient-1');

      expect(result.adherencePercent).toBe(7);
    });

    it('has no adherence without an ACTIVE routine', async () => {
      prisma.routine.findFirst.mockResolvedValue(null);

      const result = await service.getPatientStats('therapist-1', 'patient-1');

      expect(result.adherencePercent).toBeNull();
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('has no adherence before the routine starts', async () => {
      prisma.routine.findFirst.mockResolvedValue({
        id: 'routine-1',
        startDate: new Date('2026-04-01T00:00:00Z'),
        endDate: null,
      });

      const result = await service.getPatientStats('therapist-1', 'patient-1');

      expect(result.adherencePercent).toBeNull();
    });

    it("answers NotFound for another therapist's patient", async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.getPatientStats('therapist-2', 'patient-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
