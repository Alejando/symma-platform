import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { RoutinesService } from '../routines/routines.service';
import type { AuthenticatedRequest } from '../auth/types';

describe('PatientsController', () => {
  let controller: PatientsController;
  let service: PatientsService;

  const mockPatientsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockRequest = {
    user: {
      userId: 'therapist-123',
      email: 'therapist@example.com',
      role: 'THERAPIST',
    },
  } as AuthenticatedRequest;

  const mockPatient = {
    id: 'patient-456',
    therapistId: 'therapist-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    dateOfBirth: new Date('1990-01-15'),
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        { provide: PatientsService, useValue: mockPatientsService },
        { provide: RoutinesService, useValue: { findAllByPatient: jest.fn() } },
      ],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);
    service = module.get<PatientsService>(PatientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create patient with therapistId from token', async () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: '1990-01-15',
      };

      mockPatientsService.create.mockResolvedValue(mockPatient);

      const result = await controller.create(mockRequest, dto);

      expect(service.create).toHaveBeenCalledWith('therapist-123', dto);
      expect(result).toEqual(mockPatient);
    });
  });

  describe('findAll', () => {
    it('should return patients for authenticated therapist', async () => {
      mockPatientsService.findAll.mockResolvedValue([mockPatient]);

      const result = await controller.findAll(mockRequest, undefined);

      expect(service.findAll).toHaveBeenCalledWith('therapist-123', undefined);
      expect(result).toEqual([mockPatient]);
    });

    it('should pass search query to service', async () => {
      mockPatientsService.findAll.mockResolvedValue([mockPatient]);

      await controller.findAll(mockRequest, 'john');

      expect(service.findAll).toHaveBeenCalledWith('therapist-123', 'john');
    });
  });

  describe('findOne', () => {
    it('should return single patient with ownership check', async () => {
      mockPatientsService.findOne.mockResolvedValue(mockPatient);

      const result = await controller.findOne(mockRequest, 'patient-456');

      expect(service.findOne).toHaveBeenCalledWith(
        'therapist-123',
        'patient-456',
      );
      expect(result).toEqual(mockPatient);
    });
  });

  describe('update', () => {
    it('should update patient with ownership check', async () => {
      const updateDto = { diagnosis: 'Updated diagnosis' };
      mockPatientsService.update.mockResolvedValue({
        ...mockPatient,
        ...updateDto,
      });

      const result = await controller.update(
        mockRequest,
        'patient-456',
        updateDto,
      );

      expect(service.update).toHaveBeenCalledWith(
        'therapist-123',
        'patient-456',
        updateDto,
      );
      expect(result.diagnosis).toBe('Updated diagnosis');
    });
  });

  describe('remove', () => {
    it('should soft delete patient', async () => {
      mockPatientsService.remove.mockResolvedValue({
        ...mockPatient,
        status: 'ARCHIVED',
      });

      const result = await controller.remove(mockRequest, 'patient-456');

      expect(service.remove).toHaveBeenCalledWith(
        'therapist-123',
        'patient-456',
      );
      expect(result.status).toBe('ARCHIVED');
    });
  });
});
