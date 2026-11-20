import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PatientsService } from './patients.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccessCodeHasher } from '../auth/access-code-hasher.service';
import { hashAccessCode } from '../auth/access-code';

jest.mock('crypto', () => {
  const actual = jest.requireActual<typeof crypto>('crypto');
  return { ...actual, randomInt: jest.fn(actual.randomInt) };
});

describe('PatientsService', () => {
  let service: PatientsService;

  const pinSecret = 'unit-test-pin-secret';
  const prisma = {
    patient: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const therapistId = 'therapist-123';
  const patientId = 'patient-456';

  const storedPatient = {
    id: patientId,
    therapistId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    dateOfBirth: new Date('1990-01-15'),
    gender: null,
    phoneNumber: null,
    status: 'ACTIVE',
    diagnosis: null,
    initialParalysisDegree: null,
    clinicalNotes: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    accessCodeHash: 'must-never-leak',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        AccessCodeHasher,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => pinSecret },
        },
      ],
    }).compile();

    service = module.get(PatientsService);
  });

  describe('responses never expose accessCodeHash', () => {
    it.each([
      [
        'create',
        () => {
          prisma.patient.create.mockResolvedValue(storedPatient);
          return service.create(therapistId, {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            dateOfBirth: '1990-01-15',
          });
        },
      ],
      [
        'findOne',
        () => {
          prisma.patient.findFirst.mockResolvedValue(storedPatient);
          return service.findOne(therapistId, patientId);
        },
      ],
      [
        'update',
        () => {
          prisma.patient.findFirst.mockResolvedValue(storedPatient);
          prisma.patient.update.mockResolvedValue(storedPatient);
          return service.update(therapistId, patientId, { diagnosis: 'x' });
        },
      ],
      [
        'remove',
        () => {
          prisma.patient.findFirst.mockResolvedValue(storedPatient);
          prisma.patient.update.mockResolvedValue({
            ...storedPatient,
            status: 'ARCHIVED',
          });
          return service.remove(therapistId, patientId);
        },
      ],
    ])('%s', async (_name, call) => {
      const response = await call();
      expect(response).not.toHaveProperty('accessCodeHash');
      expect(JSON.stringify(response)).not.toContain('must-never-leak');
    });
  });

  describe('findAll', () => {
    it('returns a page of the therapist patients', async () => {
      prisma.patient.findMany.mockResolvedValue([storedPatient]);
      prisma.patient.count.mockResolvedValue(1);

      const result = await service.findAll(therapistId);

      expect(result).toMatchObject({ total: 1, page: 1, limit: 20 });
      expect(result.data[0]).not.toHaveProperty('accessCodeHash');
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException for a patient of another therapist', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('other-therapist', patientId),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.patient.findFirst).toHaveBeenCalledWith({
        where: { id: patientId, therapistId: 'other-therapist' },
      });
    });
  });

  describe('remove', () => {
    it('archives instead of deleting', async () => {
      prisma.patient.findFirst.mockResolvedValue(storedPatient);
      prisma.patient.update.mockResolvedValue({
        ...storedPatient,
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

  describe('generateAccessCode', () => {
    beforeEach(() => {
      prisma.patient.findFirst.mockResolvedValue(storedPatient);
      prisma.patient.update.mockResolvedValue(storedPatient);
    });

    it('draws the PIN from crypto.randomInt and stores only its HMAC', async () => {
      prisma.patient.findUnique.mockResolvedValue(null);

      const result = await service.generateAccessCode(therapistId, patientId);

      expect(crypto.randomInt).toHaveBeenCalledWith(0, 1_000_000);
      expect(result).toEqual({
        accessCode: expect.stringMatching(/^\d{6}$/),
        patientId,
      });
      expect(prisma.patient.update).toHaveBeenCalledWith({
        where: { id: patientId },
        data: { accessCodeHash: hashAccessCode(result.accessCode, pinSecret) },
      });
    });

    it('keeps zero-padded PINs six digits long', async () => {
      prisma.patient.findUnique.mockResolvedValue(null);
      (crypto.randomInt as unknown as jest.Mock).mockReturnValueOnce(42);

      const result = await service.generateAccessCode(therapistId, patientId);

      expect(result.accessCode).toBe('000042');
    });

    it('draws again when the PIN collides with another patient', async () => {
      prisma.patient.findUnique
        .mockResolvedValueOnce({ id: 'someone-else' })
        .mockResolvedValueOnce(null);

      await service.generateAccessCode(therapistId, patientId);

      expect(prisma.patient.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.patient.update).toHaveBeenCalledTimes(1);
    });
  });
});
