import { Test, TestingModule } from '@nestjs/testing';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExerciseType, ExerciseCategory } from '@prisma/client';

describe('ExercisesController', () => {
  let controller: ExercisesController;
  let service: ExercisesService;

  const mockExercisesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const exerciseId = 'test-id';
  const createDto: CreateExerciseDto = {
    keyName: 'test_ex',
    name: 'Test Exercise',
<<<<<<< /Users/alejandroprado/pratum/symma-platform/apps/api/src/exercises/exercises.controller.spec.ts
    type: ExerciseType.ISOMETRIC,
=======
    type: ExerciseType.ISOTONIC,
>>>>>>> /Users/alejandroprado/.windsurf/worktrees/symma-platform/symma-platform-48b52386/apps/api/src/exercises/exercises.controller.spec.ts
    category: ExerciseCategory.CORE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExercisesController],
      providers: [
        {
          provide: ExercisesService,
          useValue: mockExercisesService,
        },
      ],
    }).compile();

    controller = module.get<ExercisesController>(ExercisesController);
    service = module.get<ExercisesService>(ExercisesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of exercises', async () => {
      const result = [{ id: exerciseId, ...createDto }];
      mockExercisesService.findAll.mockResolvedValue(result);
      expect(await controller.findAll()).toBe(result);
    });
  });

  describe('create', () => {
    it('should create a new exercise', async () => {
      const result = { id: exerciseId, ...createDto };
      mockExercisesService.create.mockResolvedValue(result);
      expect(await controller.create(createDto)).toBe(result);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update an exercise', async () => {
      const updateDto: UpdateExerciseDto = { name: 'Updated Name' };
      const result = { id: exerciseId, ...createDto, ...updateDto };
      mockExercisesService.update.mockResolvedValue(result);
      expect(await controller.update(exerciseId, updateDto)).toBe(result);
      expect(service.update).toHaveBeenCalledWith(exerciseId, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove an exercise', async () => {
      const result = { id: exerciseId, ...createDto };
      mockExercisesService.remove.mockResolvedValue(result);
      expect(await controller.remove(exerciseId)).toBe(result);
      expect(service.remove).toHaveBeenCalledWith(exerciseId);
    });
  });
});
