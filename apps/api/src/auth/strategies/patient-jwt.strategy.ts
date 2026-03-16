import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PatientJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-patient',
) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret', // Should match AuthModule
    });
  }

  async validate(payload: any) {
    if (payload.role !== 'PATIENT') {
      throw new UnauthorizedException('Invalid token role');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: payload.sub },
    });

    if (!patient) {
      throw new UnauthorizedException();
    }

    return patient;
  }
}
