import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { MobileLoginResponse } from '@symma/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { AccessCodeHasher } from './access-code-hasher.service';
import { credentialVersionOf } from './access-code';
import { PATIENT_ROLE } from './auth.constants';
import { patientTokenTtl } from './token-ttl';
import type { PatientJwtPayload } from './types';

@Injectable()
export class PatientAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly accessCodeHasher: AccessCodeHasher,
  ) {}

  async login(accessCode: string): Promise<MobileLoginResponse> {
    const accessCodeHash = this.accessCodeHasher.hash(accessCode);

    const patient = await this.prisma.patient.findUnique({
      where: { accessCodeHash },
      select: { id: true, firstName: true, lastName: true, status: true },
    });

    if (!patient || patient.status === 'ARCHIVED') {
      throw new UnauthorizedException('errors.auth.invalidAccessCode');
    }

    const payload: PatientJwtPayload = {
      sub: patient.id,
      role: PATIENT_ROLE,
      firstName: patient.firstName,
      credentialVersion: credentialVersionOf(accessCodeHash),
    };

    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: patientTokenTtl(this.configService),
      }),
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
      },
    };
  }
}
