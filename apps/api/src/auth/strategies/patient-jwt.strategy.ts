import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PATIENT_JWT_STRATEGY, PATIENT_ROLE } from '../auth.constants';
import { credentialVersionOf } from '../access-code';
import type { AuthenticatedPatient, PatientJwtPayload } from '../types';

@Injectable()
export class PatientJwtStrategy extends PassportStrategy(
  Strategy,
  PATIENT_JWT_STRATEGY,
) {
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

  async validate(
    payload: Partial<PatientJwtPayload>,
  ): Promise<AuthenticatedPatient> {
    if (payload.role !== PATIENT_ROLE || !payload.sub) {
      throw new UnauthorizedException('errors.auth.unauthorized');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        accessCodeHash: true,
      },
    });

    const hasCurrentCredentials =
      !!patient?.accessCodeHash &&
      patient.status !== 'ARCHIVED' &&
      payload.credentialVersion === credentialVersionOf(patient.accessCodeHash);

    if (!patient || !hasCurrentCredentials) {
      throw new UnauthorizedException('errors.auth.unauthorized');
    }

    return {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
    };
  }
}
