import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { EosCalculationService } from './eos.service';
import { AggregatedCalculationsQueryDto } from './calculations.dto';

@Controller('calculations/eos')
export class EosController {
  constructor(private readonly eosService: EosCalculationService) { }

  @Post(':employeeId') // /calculations/eos/:employeeId
  async calculateEOS(
    @Param('employeeId') employeeId: string,
    @Body('terminationType') terminationType?: string,
  ) {
    return this.eosService.calculateEOS(employeeId, terminationType);
  }

  @Post('vacation/:employeeId') // /calculations/eos/vacation/:employeeId
  async calculateVacation(
    @Param('employeeId') employeeId: string,
    @Body('days') days?: number,
  ) {
    return this.eosService.calculateVacation(employeeId, days);
  }

  @Get('aggregated') // /calculations/eos/aggregated
  async getAggregatedCalculations(
    @Query() query: AggregatedCalculationsQueryDto,
  ) {
    return this.eosService.calculateAggregatedEntitlements(query);
  }
}
