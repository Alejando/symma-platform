import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types';
import { RoutinesService } from '../routines/routines.service';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly routinesService: RoutinesService,
  ) { }

  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createPatientDto: CreatePatientDto,
  ) {
    return this.patientsService.create(req.user.userId, createPatientDto);
  }

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('search') search?: string,
  ) {
    return this.patientsService.findAll(req.user.userId, search);
  }

  @Get(':id')
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.patientsService.findOne(req.user.userId, id);
  }

  @Get(':id/routines')
  getPatientRoutines(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.routinesService.findAllByPatient(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(req.user.userId, id, updatePatientDto);
  }

  @Delete(':id')
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.patientsService.remove(req.user.userId, id);
  }

  // ============================================
  // Access Code Management (Mobile PIN)
  // ============================================

  @Post(':id/access-code')
  generateAccessCode(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.patientsService.generateAccessCode(req.user.userId, id);
  }

  @Delete(':id/access-code')
  revokeAccessCode(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.patientsService.revokeAccessCode(req.user.userId, id);
  }

  @Get(':id/access-code/status')
  async hasAccessCode(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const hasCode = await this.patientsService.hasAccessCode(req.user.userId, id);
    return { hasAccessCode: hasCode };
  }
}

