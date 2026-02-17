import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustLeaveBalanceDto, LeaveBalanceResponseDto } from './leave.dto';
import { LeaveTransactionType } from '@prisma/client';

@Injectable()
export class LeaveService {
    constructor(private prisma: PrismaService) { }

    async getBalances(companyId: string): Promise<LeaveBalanceResponseDto[]> {
        const employees = await this.prisma.employee.findMany({
            where: { companyId, endDate: null }, // Active employees only
            include: {
                leaveBalances: true,
                leaveTransactions: true,
            },
            orderBy: { fullName: 'asc' },
        });

        return Promise.all(
            employees.map(async (emp) => {
                let balanceData = this.calculateCurrentBalance(emp);

                // Auto-create missing balance if it doesn't exist in DB
                if (emp.leaveBalances.length === 0) {
                    await this.prisma.leaveBalance.create({
                        data: {
                            employeeId: emp.id,
                            annualEntitledDays: balanceData.serviceYears < 5 ? 21 : 30,
                            annualUsedDays: balanceData.totalUsed,
                            calculatedRemainingDays: balanceData.vacationBalance,
                            leaveValue: balanceData.leaveValue,
                            lastCalculatedAt: new Date(),
                        },
                    });
                }

                const serviceYears = this.calculateServiceYears(emp.hireDate);
                const annualEntitledDays = serviceYears < 5 ? 21 : 30;

                return {
                    employeeId: emp.id,
                    employeeName: emp.fullName,
                    branch: emp.branch,
                    jobTitle: emp.jobTitle,
                    hireDate: emp.hireDate.toISOString(),
                    serviceYears: Number(serviceYears.toFixed(2)),
                    annualEntitledDays,
                    annualUsedDays: balanceData.totalUsed,
                    calculatedRemainingDays: balanceData.vacationBalance,
                    leaveValue: balanceData.leaveValue,
                    lastCalculatedAt:
                        emp.leaveBalances[0]?.lastCalculatedAt.toISOString() ||
                        new Date().toISOString(),
                };
            }),
        );
    }

    async adjustBalance(dto: AdjustLeaveBalanceDto, performedBy: string) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: dto.employeeId },
            include: { leaveBalances: true },
        });

        if (!employee) throw new NotFoundException('Employee not found');

        let balance = employee.leaveBalances[0];

        if (!balance) {
            const initialAccrued = this.calculateAccruedDays(employee.hireDate);
            balance = await this.prisma.leaveBalance.create({
                data: {
                    employeeId: dto.employeeId,
                    annualEntitledDays:
                        this.calculateServiceYears(employee.hireDate) < 5 ? 21 : 30,
                    annualUsedDays: 0,
                    calculatedRemainingDays: initialAccrued,
                    leaveValue: initialAccrued * (Number(employee.totalSalary) / 30),
                },
            });
        }

        // Create Transaction
        await this.prisma.leaveTransaction.create({
            data: {
                employeeId: dto.employeeId,
                leaveBalanceId: balance.id,
                type:
                    dto.days > 0
                        ? LeaveTransactionType.ADJUSTMENT
                        : LeaveTransactionType.USAGE,
                days: dto.days,
                reason: dto.reason,
                performedBy,
            },
        });

        // Update Balance
        const newRemainingDays = Number(balance.calculatedRemainingDays) + dto.days;
        const dailySalary = Number(employee.totalSalary) / 30;
        const newLeaveValue = newRemainingDays * dailySalary;

        await this.prisma.leaveBalance.update({
            where: { id: balance.id },
            data: {
                calculatedRemainingDays: newRemainingDays,
                leaveValue: newLeaveValue,
                lastCalculatedAt: new Date(),
                // If it was a usage, also update annualUsedDays
                ...(dto.days < 0 ? { annualUsedDays: { increment: Math.abs(dto.days) } } : {}),
            },
        });

        return { success: true };
    }

    async recalculateAccruals(employeeId: string) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                leaveBalances: true,
                leaveTransactions: {
                    where: { type: LeaveTransactionType.ADJUSTMENT },
                },
            },
        });

        if (!employee) throw new NotFoundException('Employee not found');

        const serviceYears = this.calculateServiceYears(employee.hireDate);
        const annualEntitledDays = serviceYears < 5 ? 21 : 30;
        const totalAccrued = this.calculateAccruedDays(employee.hireDate);

        // Sum up manual adjustments
        const manualAdjustments = employee.leaveTransactions.reduce(
            (sum, tx) => sum + Number(tx.days),
            0,
        );

        let balance = employee.leaveBalances[0];

        // We assume used days are tracked in annualUsedDays or we should sum USAGE transactions
        const usageTransactions = await this.prisma.leaveTransaction.aggregate({
            where: {
                employeeId,
                type: LeaveTransactionType.USAGE,
            },
            _sum: { days: true },
        });
        const totalUsed = Math.abs(Number(usageTransactions._sum.days || 0));

        const newRemainingDays = totalAccrued + manualAdjustments - totalUsed;
        const dailySalary = Number(employee.totalSalary) / 30;
        const newLeaveValue = newRemainingDays * dailySalary;

        if (!balance) {
            balance = await this.prisma.leaveBalance.create({
                data: {
                    employeeId: employee.id,
                    annualEntitledDays,
                    annualUsedDays: totalUsed,
                    calculatedRemainingDays: newRemainingDays,
                    leaveValue: newLeaveValue,
                },
            });
        } else {
            await this.prisma.leaveBalance.update({
                where: { id: balance.id },
                data: {
                    annualEntitledDays,
                    annualUsedDays: totalUsed,
                    calculatedRemainingDays: newRemainingDays,
                    leaveValue: newLeaveValue,
                    lastCalculatedAt: new Date(),
                },
            });
        }

        return { success: true, annualEntitledDays, newRemainingDays };
    }

    public calculateCurrentBalance(employee: any) {
        const hireDate = new Date(employee.hireDate as string | number | Date);
        const endDate = employee.endDate
            ? new Date(employee.endDate as string | number | Date)
            : new Date();
        const durationInMs = endDate.getTime() - hireDate.getTime();
        const durationInDays = durationInMs / (1000 * 60 * 60 * 24);
        const serviceYears = durationInDays / 365.25;

        // Calculate accrued days based on Saudi Labor Law
        let accruedDays = 0;
        if (serviceYears < 5) {
            accruedDays = serviceYears * 21;
        } else {
            accruedDays = 5 * 21 + (serviceYears - 5) * 30;
        }

        // Factor in transactions
        const transactions = (employee.leaveTransactions as any[]) || [];
        const manualAdjustments = transactions
            .filter((tx: any) => tx.type === 'ADJUSTMENT')
            .reduce((sum: number, tx: any) => sum + Number(tx.days), 0);

        const manualUses = transactions
            .filter((tx: any) => tx.type === 'USAGE')
            .reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.days)), 0);

        // Final balance
        const vacationBalance = Math.max(
            0,
            accruedDays + manualAdjustments - manualUses,
        );
        const dailyWage = Number(employee.totalSalary) / 30;

        return {
            vacationBalance: Number(vacationBalance.toFixed(2)),
            totalUsed: Number(manualUses.toFixed(2)),
            accruedDays: Number(accruedDays.toFixed(2)),
            manualAdjustments: Number(manualAdjustments.toFixed(2)),
            leaveValue: Number((vacationBalance * dailyWage).toFixed(2)),
            serviceYears: Number(serviceYears.toFixed(2)),
        };
    }

    private calculateServiceYears(hireDate: Date): number {
        const start = new Date(hireDate);
        const end = new Date();
        const durationInMs = end.getTime() - start.getTime();
        return durationInMs / (1000 * 60 * 60 * 24 * 365.25);
    }

    private calculateAccruedDays(hireDate: Date): number {
        const years = this.calculateServiceYears(hireDate);
        if (years < 5) {
            return years * 21;
        } else {
            return 5 * 21 + (years - 5) * 30;
        }
    }
}
