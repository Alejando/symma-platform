import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';

describe('SessionsService', () => {
  let service: SessionsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    session: {
      findUnique: jest.fn(),
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
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      mockPrismaService.session.findUnique.mockResolvedValue(mockExistingSession);

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
      expect(mockPrismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: sessionId,
          routineId,
          durationSeconds: 900,
          score: 85,
          isSynced: true,
          items: {
            create: expect.arrayContaining([
              expect.objectContaining({
                exerciseId: 'exercise-1',
                repsCompleted: 10,
                difficulty: 1,
                averageAccuracy: 85,
                seriesData: { reps: [1, 2, 3] },
              }),
            ]),
          },
        }),
        include: { items: true },
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
      expect(mockPrismaService.session.create).toHaveBeenCalledWith({
        data: expect.not.objectContaining({ id: expect.anything() }),
        include: { items: true },
      });
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

      expect(mockPrismaService.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  seriesData: { reps: [1, 2, 3] },
                }),
              ]),
            },
          }),
        }),
      );
    });
  });
});
