import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { AdjustLeaveBalanceDto } from './leave.dto';

@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get('balances/:companyId')
  async getBalances(@Param('companyId') companyId: string) {
    return this.leaveService.getBalances(companyId);
  }

  @Post('adjust')
  async adjustBalance(@Body() dto: AdjustLeaveBalanceDto, @Request() req) {
    const performedBy = req.user?.id || 'system-admin';
    return this.leaveService.adjustBalance(dto, performedBy);
  }

  @Post('recalculate/:employeeId')
  async recalculateAccruals(@Param('employeeId') employeeId: string) {
    return this.leaveService.recalculateAccruals(employeeId);
  }

  @Put('balance/:employeeId')
  async directUpdateBalance(
    @Param('employeeId') employeeId: string,
    @Body()
    body: {
      annualEntitledDays?: number;
      annualUsedDays?: number;
      calculatedRemainingDays?: number;
      leaveValue?: number;
      reason?: string;
    },
  ) {
    return this.leaveService.directUpdateBalance(employeeId, body);
  }

  @Post('transaction')
  async addTransaction(
    @Body()
    body: {
      employeeId: string;
      type: string;
      days: number;
      reason?: string;
    },
  ) {
    return this.leaveService.addTransaction(body);
  }

  @Delete('transaction/:id')
  async deleteTransaction(@Param('id') id: string) {
    return this.leaveService.deleteTransaction(id);
  }

  @Get('history/company/:companyId')
  async getCompanyHistory(
    @Param('companyId') companyId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.leaveService.getCompanyHistory(
      companyId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
  }

  @Get('history/:employeeId')
  async getEmployeeHistory(
    @Param('employeeId') employeeId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.leaveService.getEmployeeHistory(
      employeeId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
  }
}
