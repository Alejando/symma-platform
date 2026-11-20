import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Therapist } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload, LoginResponse, TherapistInfo } from './types';
import { therapistTokenTtl } from './token-ttl';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<TherapistInfo | null> {
    const therapist = await this.prisma.therapist.findUnique({
      where: { email },
    });

    if (!therapist || !therapist.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      therapist.passwordHash,
    );

    return isPasswordValid ? toTherapistInfo(therapist) : null;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('errors.auth.invalidCredentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: therapistTokenTtl(this.configService),
      }),
    };
  }

  async getProfile(userId: string): Promise<TherapistInfo | null> {
    const therapist = await this.prisma.therapist.findUnique({
      where: { id: userId },
    });

    return therapist ? toTherapistInfo(therapist) : null;
  }
}

function toTherapistInfo(therapist: Therapist): TherapistInfo {
  return {
    id: therapist.id,
    email: therapist.email,
    firstName: therapist.firstName,
    lastName: therapist.lastName,
    role: therapist.role,
    clinicId: therapist.clinicId,
  };
}
