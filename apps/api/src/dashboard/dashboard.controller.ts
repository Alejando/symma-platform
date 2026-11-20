import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import type { DashboardStatsResponse } from '@symma/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(
    @Request() req: AuthenticatedRequest,
  ): Promise<DashboardStatsResponse> {
    return this.dashboardService.getStats(req.user.userId);
  }
}
