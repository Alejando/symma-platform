import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types';

@Controller('routines')
@UseGuards(JwtAuthGuard)
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) { }

  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createRoutineDto: CreateRoutineDto,
  ) {
    return this.routinesService.create(req.user.userId, createRoutineDto);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.routinesService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.routinesService.findOne(req.user.userId, id);
  }

  @Put(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateRoutineDto: UpdateRoutineDto,
  ) {
    return this.routinesService.update(req.user.userId, id, updateRoutineDto);
  }

  @Delete(':id')
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.routinesService.remove(req.user.userId, id);
  }

  @Post(':id/clone')
  clone(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.routinesService.clone(req.user.userId, id);
  }
}
