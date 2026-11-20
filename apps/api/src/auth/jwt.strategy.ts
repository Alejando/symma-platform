import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PATIENT_ROLE } from './auth.constants';
import type { ValidatedUser } from './types';

type UnverifiedPayload = { sub?: string; email?: string; role?: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: UnverifiedPayload): Promise<ValidatedUser> {
    if (!payload.sub || !payload.email || payload.role === PATIENT_ROLE) {
      throw new UnauthorizedException('errors.auth.unauthorized');
    }

    const therapist = await this.prisma.therapist.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!therapist || !therapist.isActive) {
      throw new UnauthorizedException('errors.auth.unauthorized');
    }

    return {
      userId: therapist.id,
      email: therapist.email,
      role: therapist.role,
    };
  }
}
