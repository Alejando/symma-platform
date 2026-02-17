import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Hashes the access code using SHA-256 (Deterministic for lookup)
   */
  private hashAccessCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  async login(accessCode: string) {
    // 1. Hash the incoming code
    const hashedCode = this.hashAccessCode(accessCode);

    // 2. Find patient by unique hash
    const patient = await this.prisma.patient.findUnique({
      where: { accessCodeHash: hashedCode },
    });

    // 3. If not found, unauthorized
    if (!patient) {
      throw new UnauthorizedException('Invalid Access Code');
    }

    // 4. Return token
    const payload = {
      sub: patient.id,
      firstName: patient.firstName,
      role: 'PATIENT',
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  // Legacy method kept for reference/admin use if needed, but not for mobile login
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

    return {
      sub: patient.id,
      firstName: patient.firstName,
      role: 'PATIENT',
    };
  }
}
