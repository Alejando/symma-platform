import { Test, TestingModule } from '@nestjs/testing';
import { RoutinesService } from './routines.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutineDto, CreateRoutineItemDto } from './dto/create-routine.dto';
import { MobileModule, ExerciseType } from '@prisma/client';

describe('RoutinesService', () => {
  let service: RoutinesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    routine: {
      create: jest.fn(),
    },
    exercise: {
      findUnique: jest.fn(),
    },
    patient: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutinesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RoutinesService>(RoutinesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a routine with valid items', async () => {
      const createRoutineDto: CreateRoutineDto = {
        patientId: 'patient-id',
        name: 'Test Routine',
        startDate: '2023-01-01T00:00:00Z',
        items: [
          {
            exerciseId: 'exercise-id',
            sets: 3,
            repsPerSet: 10,
            targetHoldSeconds: 5,
            difficultyLevel: 1.0,
            mobileModule: MobileModule.EYES,
            exerciseType: ExerciseType.ISOMETRIC,
            strictMode: true,
            allowSkip: false,
          } as CreateRoutineItemDto,
        ],
      };

      const expectedResult = { id: 'routine-id', ...createRoutineDto };

      (prisma.patient.findFirst as jest.Mock).mockResolvedValue({ id: 'patient-id' });
      (prisma.routine.create as jest.Mock).mockResolvedValue(expectedResult);

      const result = await service.create('therapist-id', createRoutineDto);

      expect(prisma.routine.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: expect.arrayContaining([
              expect.objectContaining({
                sets: 3,
                repsPerSet: 10,
                exerciseId: 'exercise-id',
                targetHoldSeconds: 5,
              }),
            ]),
          },
        }),
      }));
      expect(result).toEqual(expectedResult);
    });
  });
});
