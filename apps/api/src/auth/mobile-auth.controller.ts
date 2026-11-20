import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Ip,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { MobileLoginResponse } from '@symma/shared-types';
import { PatientAuthService } from './patient-auth.service';
import { MobileLoginDto } from './dto/mobile-login.dto';
import { LoginAttemptLimiter } from './login-attempt-limiter.service';

@ApiTags('Mobile Auth')
@Controller('auth/patient')
export class MobileAuthController {
  constructor(
    private readonly patientAuthService: PatientAuthService,
    private readonly loginAttemptLimiter: LoginAttemptLimiter,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login for Mobile App using PIN' })
  @ApiResponse({ status: 200, description: 'Returns JWT Token' })
  @ApiResponse({ status: 401, description: 'Invalid PIN' })
  @ApiResponse({
    status: 429,
    description: 'Too many failed attempts from this client',
  })
  async login(
    @Ip() clientIp: string,
    @Body() loginDto: MobileLoginDto,
  ): Promise<MobileLoginResponse> {
    this.loginAttemptLimiter.assertAllowed(clientIp);

    try {
      const response = await this.patientAuthService.login(loginDto.accessCode);
      this.loginAttemptLimiter.reset(clientIp);
      return response;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.loginAttemptLimiter.recordFailure(clientIp);
      }
      throw error;
    }
  }
}
