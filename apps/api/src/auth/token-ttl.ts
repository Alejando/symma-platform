import { ConfigService } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';
import {
  DEFAULT_PATIENT_TOKEN_TTL,
  DEFAULT_THERAPIST_TOKEN_TTL,
} from './auth.constants';

type TokenTtl = NonNullable<JwtSignOptions['expiresIn']>;

export function therapistTokenTtl(configService: ConfigService): TokenTtl {
  return (configService.get<string>('JWT_THERAPIST_EXPIRES_IN') ??
    DEFAULT_THERAPIST_TOKEN_TTL) as TokenTtl;
}

export function patientTokenTtl(configService: ConfigService): TokenTtl {
  return (configService.get<string>('JWT_PATIENT_EXPIRES_IN') ??
    DEFAULT_PATIENT_TOKEN_TTL) as TokenTtl;
}
