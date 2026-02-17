import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginResponse, TherapistInfo } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

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

    if (!isPasswordValid) {
      return null;
    }

    return {
      id: therapist.id,
      email: therapist.email,
      firstName: therapist.firstName,
      lastName: therapist.lastName,
      role: therapist.role,
      clinicId: therapist.clinicId,
    };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async getProfile(userId: string): Promise<TherapistInfo | null> {
    const therapist = await this.prisma.therapist.findUnique({
      where: { id: userId },
    });

    if (!therapist) {
      return null;
    }

    return {
      id: therapist.id,
      email: therapist.email,
      firstName: therapist.firstName,
      lastName: therapist.lastName,
      role: therapist.role,
      clinicId: therapist.clinicId,
    };
  }
}
