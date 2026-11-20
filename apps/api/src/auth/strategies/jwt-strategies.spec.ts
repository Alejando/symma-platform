import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../jwt.strategy';
import { PatientJwtStrategy } from './patient-jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { credentialVersionOf } from '../access-code';

describe('JWT strategies', () => {
  const config = {
    getOrThrow: () => 'unit-secret',
  } as unknown as ConfigService;
  const prisma = {
    therapist: { findUnique: jest.fn() },
    patient: { findUnique: jest.fn() },
  };

  beforeEach(() => jest.clearAllMocks());

  describe('therapist', () => {
    const strategy = new JwtStrategy(
      config,
      prisma as unknown as PrismaService,
    );
    const payload = {
      sub: 'therapist-1',
      email: 't@symma.com',
      role: 'THERAPIST',
    };

    it('returns the current role from the database for an active therapist', async () => {
      prisma.therapist.findUnique.mockResolvedValue({
        id: 'therapist-1',
        email: 't@symma.com',
        role: 'ADMIN',
        isActive: true,
      });

      await expect(strategy.validate(payload)).resolves.toEqual({
        userId: 'therapist-1',
        email: 't@symma.com',
        role: 'ADMIN',
      });
    });

    it.each([
      ['an inactive therapist', { id: 'therapist-1', isActive: false }],
      ['a deleted therapist', null],
    ])('rejects %s', async (_case, stored) => {
      prisma.therapist.findUnique.mockResolvedValue(stored);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects patient tokens without querying', async () => {
      await expect(
        strategy.validate({ sub: 'patient-1', role: 'PATIENT' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.therapist.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('patient', () => {
    const strategy = new PatientJwtStrategy(
      config,
      prisma as unknown as PrismaService,
    );
    const currentHash = 'current-hmac';
    const payload = {
      sub: 'patient-1',
      role: 'PATIENT' as const,
      firstName: 'Ana',
      credentialVersion: credentialVersionOf(currentHash),
    };
    const storedPatient = {
      id: 'patient-1',
      firstName: 'Ana',
      lastName: 'Reyes',
      status: 'ACTIVE',
      accessCodeHash: currentHash,
    };

    it('accepts a token issued for the current PIN', async () => {
      prisma.patient.findUnique.mockResolvedValue(storedPatient);

      await expect(strategy.validate(payload)).resolves.toEqual({
        id: 'patient-1',
        firstName: 'Ana',
        lastName: 'Reyes',
      });
    });

    it.each([
      ['a revoked PIN', { ...storedPatient, accessCodeHash: null }],
      ['a regenerated PIN', { ...storedPatient, accessCodeHash: 'new-hmac' }],
      ['an archived patient', { ...storedPatient, status: 'ARCHIVED' }],
      ['a deleted patient', null],
    ])('rejects %s', async (_case, stored) => {
      prisma.patient.findUnique.mockResolvedValue(stored);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects therapist tokens', async () => {
      await expect(
        strategy.validate({ sub: 'therapist-1', role: 'THERAPIST' } as never),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
