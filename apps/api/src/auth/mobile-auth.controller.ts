import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PatientAuthService } from './patient-auth.service';
import { MobileLoginDto } from './dto/mobile-login.dto';

@ApiTags('Mobile Auth')
@Controller('auth/patient')
export class MobileAuthController {
  constructor(private readonly patientAuthService: PatientAuthService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login for Mobile App using PIN' })
  @ApiResponse({ status: 200, description: 'Returns JWT Token' })
  @ApiResponse({ status: 401, description: 'Invalid PIN or ID' })
  async login(@Body() loginDto: MobileLoginDto) {
    return this.patientAuthService.login(loginDto.accessCode);
  }
}
