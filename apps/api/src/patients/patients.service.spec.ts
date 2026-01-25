import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PatientsService', () => {
  let service: PatientsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    patient: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const therapistId = 'therapist-123';
  const patientId = 'patient-456';

  const mockPatient = {
    id: patientId,
    therapistId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    dateOfBirth: new Date('1990-01-15'),
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a patient with therapistId', async () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: '1990-01-15',
      };

      mockPrismaService.patient.create.mockResolvedValue(mockPatient);

      const result = await service.create(therapistId, dto);

      expect(prisma.patient.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          dateOfBirth: expect.any(Date),
          therapistId,
        },
      });
      expect(result).toEqual(mockPatient);
    });
  });

  describe('findAll', () => {
    it('should return only patients for the given therapistId', async () => {
      mockPrismaService.patient.findMany.mockResolvedValue([mockPatient]);

      const result = await service.findAll(therapistId);

      expect(prisma.patient.findMany).toHaveBeenCalledWith({
        where: {
          therapistId,
          status: { not: 'ARCHIVED' },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockPatient]);
    });

    it('should filter by search term', async () => {
      mockPrismaService.patient.findMany.mockResolvedValue([mockPatient]);

      await service.findAll(therapistId, 'john');

      expect(prisma.patient.findMany).toHaveBeenCalledWith({
        where: {
          therapistId,
          status: { not: 'ARCHIVED' },
          OR: [
            { firstName: { contains: 'john', mode: 'insensitive' } },
            { lastName: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return patient when owned by therapist', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue(mockPatient);

      const result = await service.findOne(therapistId, patientId);

      expect(prisma.patient.findFirst).toHaveBeenCalledWith({
        where: { id: patientId, therapistId },
      });
      expect(result).toEqual(mockPatient);
    });

    it('should throw NotFoundException for non-owned patient', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('other-therapist', patientId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove (soft delete)', () => {
    it('should set status to ARCHIVED', async () => {
      mockPrismaService.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrismaService.patient.update.mockResolvedValue({
        ...mockPatient,
        status: 'ARCHIVED',
      });

      const result = await service.remove(therapistId, patientId);

      expect(prisma.patient.update).toHaveBeenCalledWith({
        where: { id: patientId },
        data: { status: 'ARCHIVED' },
      });
      expect(result.status).toBe('ARCHIVED');
    });
  });
});
