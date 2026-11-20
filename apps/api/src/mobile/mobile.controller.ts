import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { SnapshotUploadUrlResponse } from '@symma/shared-types';
import { PatientJwtAuthGuard } from '../auth/patient-jwt-auth.guard';
import type { AuthenticatedPatientRequest } from '../auth/types';
import { MobileService } from './mobile.service';
import { ActiveRoutineResponseDto } from './dto/active-routine-response.dto';
import { SnapshotUploadUrlDto } from './dto/snapshot-upload-url.dto';

@ApiTags('Mobile Features')
@ApiBearerAuth()
@Controller('mobile')
@UseGuards(PatientJwtAuthGuard)
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Get('routine/active')
  @ApiOperation({ summary: 'Get active routine for logged-in patient' })
  @ApiResponse({
    status: 200,
    description: 'Returns full routine object with exercises',
    type: ActiveRoutineResponseDto,
  })
  getActiveRoutine(
    @Request() req: AuthenticatedPatientRequest,
  ): Promise<ActiveRoutineResponseDto | null> {
    return this.mobileService.getActiveRoutine(req.user.id);
  }

  @Post('snapshots/upload-url')
  @ApiOperation({
    summary: 'Presigned URL to upload the best-attempt snapshot',
  })
  @ApiResponse({ status: 201, description: 'Upload URL and snapshot key' })
  @ApiResponse({ status: 503, description: 'Snapshot storage not configured' })
  createSnapshotUploadUrl(
    @Request() req: AuthenticatedPatientRequest,
    @Body() dto: SnapshotUploadUrlDto,
  ): Promise<SnapshotUploadUrlResponse> {
    return this.mobileService.createSnapshotUploadUrl(req.user.id, dto);
  }
}
