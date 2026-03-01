import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';

describe('SessionsService', () => {
  let service: SessionsService;

  type SessionCreateCallArg = {
    data: {
      id?: string;
      routineId?: string;
      durationSeconds?: number;
      score?: number;
      isSynced?: boolean;
      items?: {
        create: Array<{
          exerciseId?: string;
          repsCompleted?: number;
          difficulty?: number;
          averageAccuracy?: number;
          seriesData?: unknown;
        }>;
      };
    };
    include?: {
      items?: boolean;
    };
  };

  const mockPrismaService = {
    session: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    routine: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    const therapistId = 'therapist-123';
    const sessionId = 'session-789';

    const mockSession = {
      id: sessionId,
      routineId: 'routine-456',
      date: new Date('2026-02-22T10:00:00.000Z'),
      durationSeconds: 900,
      score: 0.85,
      isSynced: true,
      createdAt: new Date('2026-02-22T10:15:00.000Z'),
      items: [
        {
          id: 'item-1',
          sessionId,
          exerciseId: 'exercise-1',
          repsCompleted: 10,
          difficulty: 1,
          averageAccuracy: 88.5,
          seriesData: { reps: [82, 85, 90] },
          exercise: {
            name: 'Smile Stretch',
          },
        },
      ],
      routine: {
        patient: {
          therapistId,
        },
      },
    };

    it('should return session detail with navigation hints', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.session.findMany.mockResolvedValue([
        { id: 'session-001' },
        { id: sessionId },
        { id: 'session-999' },
      ]);

      const result = await service.findOne(sessionId, therapistId);

      expect(mockPrismaService.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
        include: {
          items: {
            include: {
              exercise: {
                select: {
                  name: true,
                },
              },
            },
          },
          routine: {
            include: {
              patient: {
                select: {
                  therapistId: true,
                },
              },
            },
          },
        },
      });
      expect(result.score).toBe(85);
      expect(result.items[0].exerciseName).toBe('Smile Stretch');
      expect(result.navigation.previousSessionId).toBe('session-001');
      expect(result.navigation.nextSessionId).toBe('session-999');
    });

    it('should throw NotFoundException if session does not exist', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(null);

      await expect(service.findOne(sessionId, therapistId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when therapist does not own the session', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue({
        ...mockSession,
        routine: {
          patient: {
            therapistId: 'other-therapist',
          },
        },
      });

      await expect(service.findOne(sessionId, therapistId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should set previousSessionId to null when current session is the oldest', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.session.findMany.mockResolvedValue([
        { id: sessionId },
        { id: 'session-999' },
      ]);

      const result = await service.findOne(sessionId, therapistId);

      expect(result.navigation.previousSessionId).toBeNull();
      expect(result.navigation.nextSessionId).toBe('session-999');
    });

    it('should set nextSessionId to null when current session is the newest', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.session.findMany.mockResolvedValue([
        { id: 'session-001' },
        { id: sessionId },
      ]);

      const result = await service.findOne(sessionId, therapistId);

      expect(result.navigation.previousSessionId).toBe('session-001');
      expect(result.navigation.nextSessionId).toBeNull();
    });
  });

  describe('create', () => {
    const patientId = 'patient-123';
    const routineId = 'routine-456';
    const sessionId = 'session-789';

    const createSessionDto: CreateSessionDto = {
      id: sessionId,
      routineId,
      startTime: '2026-02-22T10:00:00.000Z',
      endTime: '2026-02-22T10:15:00.000Z',
      items: [
        {
          exerciseId: 'exercise-1',
          repsCompleted: 10,
          difficulty: 1,
          averageAccuracy: 85,
          seriesData: { reps: [1, 2, 3] },
        },
      ],
    };

    const mockRoutine = { id: routineId, name: 'Test Routine' };

    const mockExistingSession = {
      id: sessionId,
      routineId,
      date: new Date('2026-02-22T10:00:00.000Z'),
      durationSeconds: 900,
      score: 85,
      isSynced: true,
      items: [
        {
          id: 'item-1',
          sessionId,
          exerciseId: 'exercise-1',
          repsCompleted: 10,
          difficulty: 1,
          averageAccuracy: 85,
          seriesData: { reps: [1, 2, 3] },
        },
      ],
    };

    it('should return existing session when id already exists (idempotency)', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(
        mockExistingSession,
      );

      const result = await service.create(patientId, createSessionDto);

      expect(mockPrismaService.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
        include: { items: true },
      });
      expect(mockPrismaService.session.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockExistingSession);
    });

    it('should create new session when id does not exist', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(null);
      mockPrismaService.routine.findUnique.mockResolvedValue(mockRoutine);
      mockPrismaService.session.create.mockResolvedValue(mockExistingSession);

      const result = await service.create(patientId, createSessionDto);

      expect(mockPrismaService.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
        include: { items: true },
      });
      expect(mockPrismaService.routine.findUnique).toHaveBeenCalledWith({
        where: { id: routineId },
      });

      const createCalls = mockPrismaService.session.create.mock
        .calls as SessionCreateCallArg[][];
      const createCallArgs = createCalls[0][0];

      expect(createCallArgs.include).toEqual({ items: true });
      expect(createCallArgs.data.id).toBe(sessionId);
      expect(createCallArgs.data.routineId).toBe(routineId);
      expect(createCallArgs.data.durationSeconds).toBe(900);
      expect(createCallArgs.data.score).toBe(85);
      expect(createCallArgs.data.isSynced).toBe(true);
      expect(createCallArgs.data.items?.create[0]).toMatchObject({
        exerciseId: 'exercise-1',
        repsCompleted: 10,
        difficulty: 1,
        averageAccuracy: 85,
        seriesData: { reps: [1, 2, 3] },
      });

      expect(result).toEqual(mockExistingSession);
    });

    it('should create session without id when not provided', async () => {
      const dtoWithoutId: CreateSessionDto = {
        routineId,
        startTime: '2026-02-22T10:00:00.000Z',
        endTime: '2026-02-22T10:15:00.000Z',
        items: [],
      };

      mockPrismaService.routine.findUnique.mockResolvedValue(mockRoutine);
      mockPrismaService.session.create.mockResolvedValue({
        ...mockExistingSession,
        id: 'auto-generated-id',
      });

      await service.create(patientId, dtoWithoutId);

      expect(mockPrismaService.session.findUnique).not.toHaveBeenCalled();

      const createCalls = mockPrismaService.session.create.mock
        .calls as SessionCreateCallArg[][];
      const createCallArgs = createCalls[0][0];

      expect(createCallArgs.data.id).toBeUndefined();
      expect(createCallArgs.include).toEqual({ items: true });
    });

    it('should throw NotFoundException when routine does not exist', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(null);
      mockPrismaService.routine.findUnique.mockResolvedValue(null);

      await expect(service.create(patientId, createSessionDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should persist seriesData in session items', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(null);
      mockPrismaService.routine.findUnique.mockResolvedValue(mockRoutine);
      mockPrismaService.session.create.mockResolvedValue(mockExistingSession);

      await service.create(patientId, createSessionDto);

      const createCalls = mockPrismaService.session.create.mock
        .calls as SessionCreateCallArg[][];
      const createCallArgs = createCalls[0][0];

      expect(createCallArgs.data.items?.create[0].seriesData).toEqual({
        reps: [1, 2, 3],
      });
    });
  });
});
