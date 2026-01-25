import { Test, TestingModule } from '@nestjs/testing';
import { RoutinesService } from './routines.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('RoutinesService', () => {
  let service: RoutinesService;
  let prisma: PrismaService;

  const therapistId = 'therapist-123';
  const patientId = 'patient-456';
  const routineId = 'routine-789';

  const mockPatient = {
    id: patientId,
    therapistId,
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockRoutine = {
    id: routineId,
    patientId,
    name: 'Morning Therapy',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-01'),
    status: 'ACTIVE',
    items: [],
    patient: mockPatient,
    _count: { sessions: 0 },
  };

  const mockPrismaService = {
    patient: {
      findFirst: jest.fn(),
    },
    routine: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    routineItem: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    session: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutinesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RoutinesService>(RoutinesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      patientId,
      name: 'Morning Therapy',
      startDate: '2024-01-01',
      endDate: '2024-03-01',
      items: [
        { exerciseId: 'ex-1', targetRepetitions: 10, targetSets: 3, holdTimeSeconds: 5, restBetweenSetsSeconds: 60 },
        { exerciseId: 'ex-2', targetRepetitions: 8, targetSets: 2, holdTimeSeconds: 3, restBetweenSetsSeconds: 45 },
        { exerciseId: 'ex-3', targetRepetitions: 12, targetSets: 4, holdTimeSeconds: 0 },
      ],
    };

    it('should create 1 Routine and N RoutineItems', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrismaService.routine.create.mockResolvedValue({
        ...mockRoutine,
        items: createDto.items.map((item, index) => ({
          ...item,
          id: `item-${index}`,
          orderIndex: index,
        })),
      });

      const result = await service.create(therapistId, createDto);

      expect(prisma.patient.findFirst).toHaveBeenCalledWith({
        where: { id: patientId, therapistId },
      });

      expect(prisma.routine.create).toHaveBeenCalledWith({
        data: {
          patientId,
          name: 'Morning Therapy',
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          therapistNotes: undefined,
          items: {
            create: expect.arrayContaining([
              expect.objectContaining({ orderIndex: 0, exerciseId: 'ex-1' }),
              expect.objectContaining({ orderIndex: 1, exerciseId: 'ex-2' }),
              expect.objectContaining({ orderIndex: 2, exerciseId: 'ex-3' }),
            ]),
          },
        },
        include: expect.any(Object),
      });

      expect(result.items).toHaveLength(3);
    });

    it('should reject when startDate >= endDate', async () => {
      const invalidDto = {
        ...createDto,
        startDate: '2024-03-01',
        endDate: '2024-01-01',
      };

      await expect(service.create(therapistId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(therapistId, invalidDto)).rejects.toThrow(
        'Start date must be before end date',
      );
    });

    it('should reject when patient not owned by therapist', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue(null);

      await expect(service.create(therapistId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should correctly set orderIndex from array position', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrismaService.routine.create.mockResolvedValue(mockRoutine);

      await service.create(therapistId, createDto);

      const createCall = mockPrismaService.routine.create.mock.calls[0][0];
      const items = createCall.data.items.create;

      expect(items[0].orderIndex).toBe(0);
      expect(items[1].orderIndex).toBe(1);
      expect(items[2].orderIndex).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException for non-existent routine', async () => {
      mockPrismaService.routine.findFirst.mockResolvedValue(null);

      await expect(service.findOne(therapistId, routineId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update - Session Guarded', () => {
    it('should allow full update when routine has no sessions', async () => {
      mockPrismaService.routine.findFirst.mockResolvedValue(mockRoutine);
      mockPrismaService.session.count.mockResolvedValue(0);
      mockPrismaService.$transaction.mockResolvedValue([]);
      mockPrismaService.routine.update.mockResolvedValue(mockRoutine);

      const updateDto = {
        name: 'Updated Name',
        items: [{ exerciseId: 'ex-1', targetRepetitions: 20, targetSets: 3, holdTimeSeconds: 5 }],
      };

      await expect(service.update(therapistId, routineId, updateDto)).resolves.toBeDefined();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should reject item changes when routine has sessions', async () => {
      mockPrismaService.routine.findFirst.mockResolvedValue(mockRoutine);
      mockPrismaService.session.count.mockResolvedValue(5);

      const updateDto = {
        items: [{ exerciseId: 'ex-1', targetRepetitions: 20, targetSets: 3, holdTimeSeconds: 5 }],
      };

      await expect(service.update(therapistId, routineId, updateDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow metadata changes when routine has sessions', async () => {
      mockPrismaService.routine.findFirst.mockResolvedValue(mockRoutine);
      mockPrismaService.session.count.mockResolvedValue(5);
      mockPrismaService.routine.update.mockResolvedValue({ ...mockRoutine, name: 'New Name' });

      const updateDto = { name: 'New Name', therapistNotes: 'Updated notes' };

      await expect(service.update(therapistId, routineId, updateDto)).resolves.toBeDefined();
      expect(mockPrismaService.routine.update).toHaveBeenCalled();
    });
  });

  describe('remove - Soft/Hard Delete', () => {
    it('should hard delete when routine has no sessions', async () => {
      mockPrismaService.routine.findFirst.mockResolvedValue(mockRoutine);
      mockPrismaService.session.count.mockResolvedValue(0);
      mockPrismaService.routine.delete.mockResolvedValue(mockRoutine);

      await service.remove(therapistId, routineId);

      expect(mockPrismaService.routine.delete).toHaveBeenCalledWith({ where: { id: routineId } });
      expect(mockPrismaService.routine.update).not.toHaveBeenCalled();
    });

    it('should soft delete (archive) when routine has sessions', async () => {
      mockPrismaService.routine.findFirst.mockResolvedValue(mockRoutine);
      mockPrismaService.session.count.mockResolvedValue(10);
      mockPrismaService.routine.update.mockResolvedValue({ ...mockRoutine, status: 'ARCHIVED' });

      await service.remove(therapistId, routineId);

      expect(mockPrismaService.routine.update).toHaveBeenCalledWith({
        where: { id: routineId },
        data: { status: 'ARCHIVED' },
      });
      expect(mockPrismaService.routine.delete).not.toHaveBeenCalled();
    });
  });

  describe('clone', () => {
    it('should create a deep copy with new ID and reset dates', async () => {
      const routineWithItems = {
        ...mockRoutine,
        items: [
          { exerciseId: 'ex-1', targetRepetitions: 10, targetSets: 3, holdTimeSeconds: 5, restBetweenSetsSeconds: 60 },
        ],
      };
      mockPrismaService.routine.findFirst.mockResolvedValue(routineWithItems);
      mockPrismaService.routine.create.mockResolvedValue({
        ...routineWithItems,
        id: 'new-routine-id',
        name: 'Morning Therapy (Copy)',
        startDate: new Date(),
        status: 'ACTIVE',
      });

      const result = await service.clone(therapistId, routineId);

      expect(mockPrismaService.routine.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          patientId,
          name: 'Morning Therapy (Copy)',
          startDate: expect.any(Date),
          endDate: null,
          status: 'ACTIVE',
          items: {
            create: expect.arrayContaining([
              expect.objectContaining({ exerciseId: 'ex-1' }),
            ]),
          },
        }),
        include: expect.any(Object),
      });
      expect(result.name).toBe('Morning Therapy (Copy)');
    });
  });
});

