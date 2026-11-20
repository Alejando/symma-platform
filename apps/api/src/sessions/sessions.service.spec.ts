import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { SnapshotStorage } from '../storage/snapshot-storage.service';
import { CreateSessionDto } from './dto/create-session.dto';

describe('SessionsService', () => {
  let service: SessionsService;

  const prisma = {
    session: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    routine: { findUnique: jest.fn() },
    exercise: { count: jest.fn() },
  };
  const snapshotStorage = {
    createReadUrl: jest.fn((key: string | null) =>
      Promise.resolve(key ? `https://signed.example/${key}` : null),
    ),
  };

  const patientId = 'patient-123';
  const routineId = 'routine-456';
  const sessionId = '9b2f6a3c-1d4e-4f5a-8b6c-7d8e9f0a1b2c';

  const storedSession = (ownerId = patientId) => ({
    id: sessionId,
    routineId,
    date: new Date('2026-02-22T10:00:00.000Z'),
    durationSeconds: 900,
    score: 85,
    isSynced: true,
    calibration: null,
    createdAt: new Date('2026-02-22T10:15:00.000Z'),
    items: [
      {
        id: 'item-1',
        sessionId,
        exerciseId: 'exercise-1',
        repsCompleted: 10,
        averageAccuracy: 85,
        symmetryScore: 92,
        averageHoldSeconds: 2.5,
        snapshotKey: null,
        seriesData: null,
      },
    ],
    routine: { patientId: ownerId },
  });

  const dto = (
    overrides: Partial<CreateSessionDto> = {},
  ): CreateSessionDto => ({
    id: sessionId,
    routineId,
    startTime: '2026-02-22T10:00:00.000Z',
    endTime: '2026-02-22T10:15:00.000Z',
    items: [
      {
        exerciseId: 'exercise-1',
        repsCompleted: 10,
        averageAccuracy: 80,
        symmetryScore: 90,
        averageHoldSeconds: 2,
        seriesData: { reps: [1, 2, 3] },
      },
      { exerciseId: 'exercise-2', repsCompleted: 5, averageAccuracy: 90 },
    ],
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SnapshotStorage, useValue: snapshotStorage },
      ],
    }).compile();

    service = module.get(SessionsService);
  });

  describe('findOne', () => {
    const therapistId = 'therapist-123';
    const sessionWithTherapist = (ownerTherapistId: string) => ({
      ...storedSession(),
      items: [
        {
          ...storedSession().items[0],
          snapshotKey: 'snapshots/p/s/e.jpg',
          exercise: { name: 'Smile Stretch' },
        },
      ],
      routine: { patient: { therapistId: ownerTherapistId } },
    });

    it('returns metrics, a signed snapshot URL and navigation hints', async () => {
      prisma.session.findUnique.mockResolvedValue(
        sessionWithTherapist(therapistId),
      );
      prisma.session.findFirst
        .mockResolvedValueOnce({ id: 'session-001' })
        .mockResolvedValueOnce({ id: 'session-999' });

      const result = await service.findOne(sessionId, therapistId);

      expect(result.score).toBe(85);
      expect(result.items[0]).toMatchObject({
        exerciseName: 'Smile Stretch',
        symmetryScore: 92,
        averageHoldSeconds: 2.5,
        snapshotUrl: 'https://signed.example/snapshots/p/s/e.jpg',
      });
      expect(result.items[0]).not.toHaveProperty('snapshotKey');
      expect(result.navigation).toEqual({
        previousSessionId: 'session-001',
        nextSessionId: 'session-999',
      });
    });

    it('returns null navigation at both ends', async () => {
      prisma.session.findUnique.mockResolvedValue(
        sessionWithTherapist(therapistId),
      );
      prisma.session.findFirst.mockResolvedValue(null);

      const result = await service.findOne(sessionId, therapistId);

      expect(result.navigation).toEqual({
        previousSessionId: null,
        nextSessionId: null,
      });
    });

    it('throws NotFoundException if the session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(service.findOne(sessionId, therapistId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for another therapist', async () => {
      prisma.session.findUnique.mockResolvedValue(
        sessionWithTherapist('other-therapist'),
      );

      await expect(service.findOne(sessionId, therapistId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    const givenActiveOwnRoutine = () => {
      prisma.session.findUnique.mockResolvedValueOnce(null);
      prisma.routine.findUnique.mockResolvedValue({
        patientId,
        status: 'ACTIVE',
      });
      prisma.exercise.count.mockResolvedValue(2);
      prisma.session.create.mockResolvedValue(storedSession());
    };

    it('returns the stored session without creating when the same patient replays the id', async () => {
      prisma.session.findUnique.mockResolvedValue(storedSession());

      const result = await service.create(patientId, dto());

      expect(prisma.session.create).not.toHaveBeenCalled();
      expect(result.created).toBe(false);
      expect(result.session.id).toBe(sessionId);
    });

    it("rejects replaying another patient's session id", async () => {
      prisma.session.findUnique.mockResolvedValue(storedSession('intruder'));

      await expect(service.create(patientId, dto())).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('creates the session with every metric and the 0–100 average as score', async () => {
      givenActiveOwnRoutine();
      const calibration = {
        capturedAt: '2026-02-22T09:59:00.000Z',
        values: { smileMax: 0.8 },
      };

      const result = await service.create(patientId, dto({ calibration }));

      const { data } = prisma.session.create.mock.calls[0][0] as {
        data: Prisma.SessionUncheckedCreateInput & {
          items: {
            create: Prisma.SessionItemUncheckedCreateWithoutSessionInput[];
          };
        };
      };
      expect(result.created).toBe(true);
      expect(data).toMatchObject({
        id: sessionId,
        routineId,
        durationSeconds: 900,
        score: 85,
        isSynced: true,
        calibration,
      });
      expect(data.items.create[0]).toMatchObject({
        exerciseId: 'exercise-1',
        averageAccuracy: 80,
        symmetryScore: 90,
        averageHoldSeconds: 2,
        seriesData: { reps: [1, 2, 3] },
      });
    });

    it('treats a concurrent insert of the same id as a replay', async () => {
      givenActiveOwnRoutine();
      prisma.session.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );
      prisma.session.findUnique.mockResolvedValueOnce(storedSession());

      const result = await service.create(patientId, dto());

      expect(result.created).toBe(false);
      expect(result.session.id).toBe(sessionId);
    });

    it('throws NotFoundException when the routine does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null);
      prisma.routine.findUnique.mockResolvedValue(null);

      await expect(service.create(patientId, dto())).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws ForbiddenException for another patient's routine", async () => {
      prisma.session.findUnique.mockResolvedValue(null);
      prisma.routine.findUnique.mockResolvedValue({
        patientId: 'someone-else',
        status: 'ACTIVE',
      });

      await expect(service.create(patientId, dto())).rejects.toThrow(
        ForbiddenException,
      );
    });

    it.each(['DRAFT', 'ARCHIVED'])(
      'throws ConflictException for a %s routine',
      async (status) => {
        prisma.session.findUnique.mockResolvedValue(null);
        prisma.routine.findUnique.mockResolvedValue({ patientId, status });

        await expect(service.create(patientId, dto())).rejects.toThrow(
          ConflictException,
        );
      },
    );

    it('rejects unknown exercises', async () => {
      givenActiveOwnRoutine();
      prisma.exercise.count.mockResolvedValue(1);

      await expect(service.create(patientId, dto())).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects a snapshot key outside the patient's session folder", async () => {
      givenActiveOwnRoutine();
      const items = [
        {
          exerciseId: 'exercise-1',
          repsCompleted: 1,
          snapshotKey: `snapshots/other-patient/${sessionId}/exercise-1.jpg`,
        },
      ];
      prisma.exercise.count.mockResolvedValue(1);

      await expect(service.create(patientId, dto({ items }))).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
