import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PatientAuthService } from './patient-auth.service';
import { MobileAuthController } from './mobile-auth.controller';
import { PatientJwtStrategy } from './strategies/patient-jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'super-secret',
        signOptions: { expiresIn: '7d' }, // Longer expiry for mobile
      }),
    }),
  ],
  controllers: [AuthController, MobileAuthController],
  providers: [AuthService, JwtStrategy, PatientAuthService, PatientJwtStrategy],
  exports: [AuthService, PatientAuthService],
})
export class AuthModule {}
