import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const prisma = {
    patient: { count: jest.fn(), findMany: jest.fn() },
    session: { aggregate: jest.fn(), groupBy: jest.fn() },
    routine: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: new Date('2026-03-10T12:00:00Z') });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(DashboardService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('averages efficacy in the database and resolves inactivity with two queries', async () => {
    prisma.patient.count.mockResolvedValue(4);
    prisma.patient.findMany.mockResolvedValue([
      { id: 'p1', firstName: 'Ana', lastName: 'Reyes' },
      { id: 'p2', firstName: 'Luis', lastName: 'Mora' },
    ]);
    prisma.session.aggregate.mockResolvedValue({ _avg: { score: 72.6 } });
    prisma.routine.findMany.mockResolvedValue([
      {
        id: 'r1',
        patientId: 'p1',
        status: 'ACTIVE',
        startDate: new Date('2026-01-01T00:00:00Z'),
      },
      {
        id: 'r2',
        patientId: 'p1',
        status: 'ARCHIVED',
        startDate: new Date('2025-10-01T00:00:00Z'),
      },
      {
        id: 'r3',
        patientId: 'p2',
        status: 'ACTIVE',
        startDate: new Date('2026-02-28T12:00:00Z'),
      },
    ]);
    prisma.session.groupBy.mockResolvedValue([
      { routineId: 'r1', _max: { date: new Date('2026-03-05T12:00:00Z') } },
      { routineId: 'r2', _max: { date: new Date('2025-12-01T12:00:00Z') } },
    ]);

    const result = await service.getStats('therapist-1');

    expect(result.metrics).toEqual({
      activePatients: { value: 4, trend: 0 },
      complianceAlerts: { value: 2, trend: 0 },
      avgEfficacy: { value: 73, trend: 0 },
    });
    expect(result.atRiskPatients).toEqual([
      { id: 'p2', name: 'Luis Mora', daysInactive: 10 },
      { id: 'p1', name: 'Ana Reyes', daysInactive: 5 },
    ]);
    expect(prisma.routine.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.session.groupBy).toHaveBeenCalledTimes(1);
  });

  it('skips the inactivity queries when nobody is at risk', async () => {
    prisma.patient.count.mockResolvedValue(1);
    prisma.patient.findMany.mockResolvedValue([]);
    prisma.session.aggregate.mockResolvedValue({ _avg: { score: null } });

    const result = await service.getStats('therapist-1');

    expect(result.metrics.avgEfficacy.value).toBe(0);
    expect(result.atRiskPatients).toEqual([]);
    expect(prisma.routine.findMany).not.toHaveBeenCalled();
  });
});
