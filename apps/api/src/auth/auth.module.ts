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
import { AccessCodeHasher } from './access-code-hasher.service';
import { LoginAttemptLimiter } from './login-attempt-limiter.service';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController, MobileAuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PatientAuthService,
    PatientJwtStrategy,
    AccessCodeHasher,
    LoginAttemptLimiter,
    RolesGuard,
  ],
  exports: [AuthService, PatientAuthService, AccessCodeHasher, RolesGuard],
})
export class AuthModule {}
