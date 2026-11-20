import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import type {
  PatientStatsResponse,
  RoutineHistoryResponse,
  RoutineStatsResponse,
} from '@symma/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { AnalyticsService } from './analytics.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('routines/:id/stats')
  getRoutineStats(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<RoutineStatsResponse> {
    return this.analyticsService.getRoutineStats(req.user.userId, id);
  }

  @Get('routines/:id/history')
  getRoutineHistory(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ): Promise<RoutineHistoryResponse> {
    return this.analyticsService.getRoutineHistory(req.user.userId, id, query);
  }

  @Get('patients/:id/stats')
  getPatientStats(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<PatientStatsResponse> {
    return this.analyticsService.getPatientStats(req.user.userId, id);
  }
}
