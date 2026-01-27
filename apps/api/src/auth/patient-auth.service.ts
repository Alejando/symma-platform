import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async validatePatient(patientId: string, accessCode: string): Promise<any> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient || !patient.authPinHash) {
      return null;
    }

    const isPinValid = await bcrypt.compare(accessCode, patient.authPinHash);

    if (!isPinValid) {
      return null;
    }

    // Return payload for JWT
    return {
      sub: patient.id,
      firstName: patient.firstName,
      role: 'PATIENT',
    };
  }

  async login(patientId: string, accessCode: string) {
    const user = await this.validatePatient(patientId, accessCode);

    if (!user) {
      throw new UnauthorizedException('Invalid Patient ID or Access Code');
    }

    return {
      access_token: this.jwtService.sign(user),
    };
  }
}
