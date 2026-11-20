import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PatientAuthService } from './patient-auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccessCodeHasher } from './access-code-hasher.service';
import { credentialVersionOf, hashAccessCode } from './access-code';

describe('PatientAuthService', () => {
  let service: PatientAuthService;
  let jwtService: JwtService;

  const pinSecret = 'unit-pin-secret';
  const prisma = { patient: { findUnique: jest.fn() } };
  const patient = {
    id: 'patient-1',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientAuthService,
        AccessCodeHasher,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: new JwtService({ secret: 'unit-secret' }),
        },
        {
          provide: ConfigService,
          useValue: { get: () => undefined, getOrThrow: () => pinSecret },
        },
      ],
    }).compile();

    service = module.get(PatientAuthService);
    jwtService = module.get(JwtService);
  });

  it('looks the patient up by the HMAC of the PIN', async () => {
    prisma.patient.findUnique.mockResolvedValue(patient);

    await service.login('123456');

    expect(prisma.patient.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { accessCodeHash: hashAccessCode('123456', pinSecret) },
      }),
    );
  });

  it('signs a 7-day patient token bound to the current PIN', async () => {
    prisma.patient.findUnique.mockResolvedValue(patient);

    const response = await service.login('123456');
    const payload = jwtService.verify<{
      sub: string;
      role: string;
      credentialVersion: string;
      iat: number;
      exp: number;
    }>(response.accessToken);

    expect(response.patient).toEqual({
      id: 'patient-1',
      firstName: 'Carlos',
      lastName: 'Mendoza',
    });
    expect(payload).toMatchObject({
      sub: 'patient-1',
      role: 'PATIENT',
      credentialVersion: credentialVersionOf(
        hashAccessCode('123456', pinSecret),
      ),
    });
    expect(payload.exp - payload.iat).toBe(7 * 24 * 60 * 60);
  });

  it.each([
    ['an unknown PIN', null],
    ['an archived patient', { ...patient, status: 'ARCHIVED' }],
  ])('rejects %s', async (_case, stored) => {
    prisma.patient.findUnique.mockResolvedValue(stored);

    await expect(service.login('123456')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
