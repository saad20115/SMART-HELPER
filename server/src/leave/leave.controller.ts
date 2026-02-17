import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { AdjustLeaveBalanceDto } from './leave.dto';

@Controller('leave')
export class LeaveController {
    constructor(private readonly leaveService: LeaveService) { }

    @Get('balances/:companyId')
    async getBalances(@Param('companyId') companyId: string) {
        return this.leaveService.getBalances(companyId);
    }

    @Post('adjust')
    async adjustBalance(@Body() dto: AdjustLeaveBalanceDto, @Request() req) {
        // Assuming user ID is available in request from auth guard, or pass it explicitly for now
        // For this iteration, we'll use a placeholder 'admin' or extract from a header if needed
        const performedBy = req.user?.id || 'system-admin';
        return this.leaveService.adjustBalance(dto, performedBy);
    }

    @Post('recalculate/:employeeId')
    async recalculateAccruals(@Param('employeeId') employeeId: string) {
        return this.leaveService.recalculateAccruals(employeeId);
    }
}
