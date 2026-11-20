import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExercisesService', () => {
  let service: ExercisesService;

  const prisma = {
    exercise: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    routine: { count: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ExercisesService);
  });

  it('answers NotFound for an unknown exercise', async () => {
    prisma.exercise.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  describe.each([
    [
      'update',
      (s: ExercisesService) => s.update('exercise-1', { name: 'New' }),
    ],
    ['remove', (s: ExercisesService) => s.remove('exercise-1')],
  ])('%s', (_name, call) => {
    beforeEach(() => {
      prisma.exercise.findUnique.mockResolvedValue({ id: 'exercise-1' });
    });

    it('is refused with 409 while an ACTIVE routine uses the exercise', async () => {
      prisma.routine.count.mockResolvedValue(2);

      const error = await call(service).catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        message: 'errors.exercises.inUse',
        args: { routines: 2 },
      });
      expect(prisma.routine.count).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          items: { some: { exerciseId: 'exercise-1' } },
        },
      });
      expect(prisma.exercise.update).not.toHaveBeenCalled();
      expect(prisma.exercise.delete).not.toHaveBeenCalled();
    });

    it('is allowed when no ACTIVE routine uses it', async () => {
      prisma.routine.count.mockResolvedValue(0);

      await call(service);

      expect(
        prisma.exercise.update.mock.calls.length +
          prisma.exercise.delete.mock.calls.length,
      ).toBe(1);
    });
  });
});
