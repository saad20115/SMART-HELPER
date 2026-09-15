import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { EosCalculationService } from './eos.service';
import { AggregatedCalculationsQueryDto } from './calculations.dto';

@Controller('calculations/eos')
export class EosController {
  constructor(private readonly eosService: EosCalculationService) { }

  // Static routes MUST come before parameterized routes
  @Get('aggregated')
  async getAggregatedCalculations(
    @Query() query: AggregatedCalculationsQueryDto,
  ) {
    return this.eosService.calculateAggregatedEntitlements(query);
  }

  @Get('settlement-preview')
  async getSettlementPreview(
    @Query('employeeId') employeeId: string,
    @Query('endDate') endDate: string,
    @Query('terminationType') terminationType: string,
  ) {
    return this.eosService.getSettlementPreview(
      employeeId,
      endDate,
      terminationType,
    );
  }

  @Get('settlements')
  async getSettlements() {
    return this.eosService.getSettlements();
  }

  @Post('terminate')
  async terminateEmployee(
    @Body()
    body: {
      employeeId: string;
      endDate: string;
      terminationType: string;
      notes?: string;
    },
  ) {
    return this.eosService.terminateEmployee(body);
  }

  @Post('vacation/:employeeId')
  async calculateVacation(
    @Param('employeeId') employeeId: string,
    @Body('days') days?: number,
  ) {
    return this.eosService.calculateVacation(employeeId, days);
  }

  @Post('reactivate')
  async reactivateEmployee(
    @Body() body: { employeeId: string },
  ) {
    return this.eosService.reactivateEmployee(body.employeeId);
  }

  // Parameterized route MUST be last
  @Post(':employeeId')
  async calculateEOS(
    @Param('employeeId') employeeId: string,
    @Body('terminationType') terminationType?: string,
  ) {
    return this.eosService.calculateEOS(employeeId, terminationType);
  }
}
