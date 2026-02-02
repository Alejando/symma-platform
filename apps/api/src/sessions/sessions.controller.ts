import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(AuthGuard('jwt-patient'))
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new therapy session record' })
  create(@Request() req, @Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.create(req.user.id, createSessionDto);
  }
}
