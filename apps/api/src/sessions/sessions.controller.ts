import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {
  SessionDetailResponse,
  SessionResponse,
} from '@symma/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatientJwtAuthGuard } from '../auth/patient-jwt-auth.guard';
import type {
  AuthenticatedPatientRequest,
  AuthenticatedRequest,
} from '../auth/types';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionsService } from './sessions.service';

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @UseGuards(PatientJwtAuthGuard)
  @ApiOperation({ summary: 'Record a therapy session (idempotent by id)' })
  @ApiResponse({ status: 201, description: 'Session created' })
  @ApiResponse({ status: 200, description: 'Replay of an existing session' })
  @ApiResponse({
    status: 403,
    description: 'Routine or session of another patient',
  })
  @ApiResponse({ status: 409, description: 'Routine is not ACTIVE' })
  async create(
    @Request() req: AuthenticatedPatientRequest,
    @Body() createSessionDto: CreateSessionDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponse> {
    const { session, created } = await this.sessionsService.create(
      req.user.id,
      createSessionDto,
    );
    response.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return session;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get session detail for therapist review' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Session with items and navigation',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<SessionDetailResponse> {
    return this.sessionsService.findOne(id, req.user.userId);
  }
}
