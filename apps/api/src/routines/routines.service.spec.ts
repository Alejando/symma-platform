import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutineDto } from './dto/create-routine.dto';

describe('RoutinesService', () => {
  let service: RoutinesService;

  const prisma = {
    $transaction: jest.fn(),
    routine: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    routineItem: { deleteMany: jest.fn(), createMany: jest.fn() },
    patient: { findFirst: jest.fn() },
  };

  const therapistId = 'therapist-1';
  const patientId = 'patient-1';

  const storedPatient = {
    id: patientId,
    therapistId,
    firstName: 'Ana',
    lastName: 'Reyes',
    dateOfBirth: new Date('1990-05-01T00:00:00Z'),
    gender: null,
    phoneNumber: null,
    email: 'ana@example.com',
    status: 'ACTIVE',
    diagnosis: null,
    initialParalysisDegree: null,
    clinicalNotes: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const storedRoutine = (overrides: Record<string, unknown> = {}) => ({
    id: 'routine-1',
    patientId,
    name: 'Phase 2',
    status: 'ACTIVE',
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: null,
    therapistNotes: null,
    items: [
      {
        exerciseId: 'exercise-1',
        sets: 3,
        repsPerSet: 10,
        targetHoldSeconds: 5,
        difficultyLevel: 1,
        restBetweenSets: 30,
        strictMode: false,
        allowSkip: true,
      },
    ],
    patient: storedPatient,
    _count: { sessions: 0 },
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (work: (tx: typeof prisma) => Promise<unknown>) => work(prisma),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutinesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(RoutinesService);
  });

  describe('findOne', () => {
    it('returns the patient with the same date-only birth date as the patients endpoints', async () => {
      prisma.routine.findFirst.mockResolvedValue(storedRoutine());

      const routine = await service.findOne(therapistId, 'routine-1');

      expect(routine.patient.dateOfBirth).toBe('1990-05-01');
      expect(routine.sessionsCount).toBe(0);
    });
  });

  describe('create', () => {
    const dto: CreateRoutineDto = {
      patientId,
      name: 'Phase 3',
      startDate: '2026-03-01T00:00:00Z',
      items: [
        {
          exerciseId: 'exercise-1',
          sets: 3,
          repsPerSet: 10,
          targetHoldSeconds: 5,
        },
      ],
    };

    it('archives the previous ACTIVE routine and creates the new one ACTIVE', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: patientId });
      prisma.routine.create.mockResolvedValue(
        storedRoutine({ id: 'routine-2' }),
      );

      await service.create(therapistId, dto);

      expect(prisma.routine.updateMany).toHaveBeenCalledWith({
        where: { patientId, status: 'ACTIVE' },
        data: { status: 'ARCHIVED' },
      });
      expect(prisma.routine.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ACTIVE',
            items: {
              create: [
                expect.objectContaining({
                  exerciseId: 'exercise-1',
                  orderIndex: 0,
                  sets: 3,
                  restBetweenSets: 60,
                }),
              ],
            },
          }),
        }),
      );
    });

    it("rejects another therapist's patient", async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(service.create(therapistId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.routine.create).not.toHaveBeenCalled();
    });
  });

  describe('clone', () => {
    it('creates a DRAFT copy and leaves the original untouched', async () => {
      prisma.routine.findFirst.mockResolvedValue(storedRoutine());
      prisma.routine.create.mockResolvedValue(
        storedRoutine({ id: 'routine-copy', status: 'DRAFT' }),
      );

      await service.clone(therapistId, 'routine-1');

      expect(prisma.routine.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DRAFT',
            name: 'Phase 2 (Copy)',
          }),
        }),
      );
      expect(prisma.routine.update).not.toHaveBeenCalled();
      expect(prisma.routine.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('activate', () => {
    it('archives the other ACTIVE routine and activates this one in one transaction', async () => {
      prisma.routine.findFirst.mockResolvedValue(
        storedRoutine({ status: 'DRAFT' }),
      );
      prisma.routine.update.mockResolvedValue(storedRoutine());

      await service.activate(therapistId, 'routine-1');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.routine.updateMany).toHaveBeenCalledWith({
        where: { patientId, status: 'ACTIVE' },
        data: { status: 'ARCHIVED' },
      });
      expect(prisma.routine.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'routine-1' },
          data: { status: 'ACTIVE' },
        }),
      );
    });

    it('is a no-op for an already ACTIVE routine', async () => {
      prisma.routine.findFirst.mockResolvedValue(storedRoutine());

      const result = await service.activate(therapistId, 'routine-1');

      expect(result.status).toBe('ACTIVE');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("answers NotFound for another therapist's routine", async () => {
      prisma.routine.findFirst.mockResolvedValue(null);

      await expect(service.activate(therapistId, 'routine-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('refuses to replace exercises once sessions exist', async () => {
      prisma.routine.findFirst.mockResolvedValue(
        storedRoutine({ _count: { sessions: 2 } }),
      );

      await expect(
        service.update(therapistId, 'routine-1', {
          items: [
            {
              exerciseId: 'exercise-2',
              sets: 1,
              repsPerSet: 1,
              targetHoldSeconds: 0,
            },
          ],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('archives a routine with sessions', async () => {
      prisma.routine.findFirst.mockResolvedValue(
        storedRoutine({ _count: { sessions: 1 } }),
      );

      await service.remove(therapistId, 'routine-1');

      expect(prisma.routine.update).toHaveBeenCalledWith({
        where: { id: 'routine-1' },
        data: { status: 'ARCHIVED' },
      });
      expect(prisma.routine.delete).not.toHaveBeenCalled();
    });

    it('deletes a routine without sessions', async () => {
      prisma.routine.findFirst.mockResolvedValue(storedRoutine());

      await service.remove(therapistId, 'routine-1');

      expect(prisma.routine.delete).toHaveBeenCalledWith({
        where: { id: 'routine-1' },
      });
    });
  });
});
