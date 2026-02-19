import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@Query('companyId') companyId?: string) {
    return this.dashboardService.getStats(companyId);
  }

  @Get('activity')
  getRecentActivity(@Query('companyId') companyId?: string) {
    return this.dashboardService.getRecentActivity(companyId);
  }
}
