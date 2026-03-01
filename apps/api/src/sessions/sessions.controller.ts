import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types';

type AuthenticatedPatientRequest = {
  user: {
    id: string;
  };
};

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt-patient'))
  @ApiOperation({ summary: 'Create a new therapy session record' })
  create(
    @Request() req: AuthenticatedPatientRequest,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    return this.sessionsService.create(req.user.id, createSessionDto);
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
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.sessionsService.findOne(id, req.user.userId);
  }
}
