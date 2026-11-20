import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const password = 'Therapist123!';
  const prisma = { therapist: { findUnique: jest.fn() } };

  const storedTherapist = async (overrides: Record<string, unknown> = {}) => ({
    id: 'therapist-1',
    clinicId: 'clinic-1',
    email: 'dra.garcia@symma.com',
    passwordHash: await bcrypt.hash(password, 4),
    firstName: 'Ana',
    lastName: 'García',
    role: 'THERAPIST',
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: new JwtService({ secret: 'unit-secret' }),
        },
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    }).compile();

    service = module.get(AuthService);
    jwtService = module.get(JwtService);
  });

  describe('validateUser', () => {
    it('returns the therapist without the password hash for valid credentials', async () => {
      prisma.therapist.findUnique.mockResolvedValue(await storedTherapist());

      const user = await service.validateUser('dra.garcia@symma.com', password);

      expect(user).toEqual({
        id: 'therapist-1',
        email: 'dra.garcia@symma.com',
        firstName: 'Ana',
        lastName: 'García',
        role: 'THERAPIST',
        clinicId: 'clinic-1',
      });
    });

    it('rejects a wrong password', async () => {
      prisma.therapist.findUnique.mockResolvedValue(await storedTherapist());

      await expect(
        service.validateUser('dra.garcia@symma.com', 'wrong'),
      ).resolves.toBeNull();
    });

    it('rejects an unknown email', async () => {
      prisma.therapist.findUnique.mockResolvedValue(null);

      await expect(
        service.validateUser('nobody@symma.com', password),
      ).resolves.toBeNull();
    });

    it('rejects an inactive therapist even with the right password', async () => {
      prisma.therapist.findUnique.mockResolvedValue(
        await storedTherapist({ isActive: false }),
      );

      await expect(
        service.validateUser('dra.garcia@symma.com', password),
      ).resolves.toBeNull();
    });
  });

  describe('login', () => {
    it('signs a token with the therapist identity and the 8h default lifetime', async () => {
      prisma.therapist.findUnique.mockResolvedValue(await storedTherapist());

      const { accessToken } = await service.login(
        'dra.garcia@symma.com',
        password,
      );
      const payload = jwtService.verify<{
        sub: string;
        email: string;
        role: string;
        iat: number;
        exp: number;
      }>(accessToken);

      expect(payload).toMatchObject({
        sub: 'therapist-1',
        email: 'dra.garcia@symma.com',
        role: 'THERAPIST',
      });
      expect(payload.exp - payload.iat).toBe(8 * 60 * 60);
    });

    it('throws Unauthorized with a translatable key for bad credentials', async () => {
      prisma.therapist.findUnique.mockResolvedValue(null);

      const error = await service
        .login('nobody@symma.com', password)
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).message).toBe(
        'errors.auth.invalidCredentials',
      );
    });
  });

  describe('getProfile', () => {
    it('returns null for an unknown therapist', async () => {
      prisma.therapist.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('missing')).resolves.toBeNull();
    });
  });
});
