import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustLeaveBalanceDto, LeaveBalanceResponseDto, EmployeeLeaveHistoryDto } from './leave.dto';
import { LeaveTransactionType } from '@prisma/client';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

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
        const balanceData = this.calculateCurrentBalance(emp);

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
        ...(dto.days < 0
          ? { annualUsedDays: { increment: Math.abs(dto.days) } }
          : {}),
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

  /**
   * Direct update of leave balance fields — for quick manual correction
   */
  async directUpdateBalance(
    employeeId: string,
    data: {
      annualEntitledDays?: number;
      annualUsedDays?: number;
      calculatedRemainingDays?: number;
      leaveValue?: number;
      reason?: string;
    },
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { leaveBalances: true },
    });

    if (!employee) throw new NotFoundException('Employee not found');

    const balance = employee.leaveBalances[0];
    if (!balance) throw new NotFoundException('Leave balance not found');

    const updateData: any = { lastCalculatedAt: new Date() };

    if (data.annualEntitledDays !== undefined)
      updateData.annualEntitledDays = data.annualEntitledDays;
    if (data.annualUsedDays !== undefined)
      updateData.annualUsedDays = data.annualUsedDays;
    if (data.calculatedRemainingDays !== undefined)
      updateData.calculatedRemainingDays = data.calculatedRemainingDays;

    // Auto-calculate leave value if remaining days changed
    if (data.leaveValue !== undefined) {
      updateData.leaveValue = data.leaveValue;
    } else if (data.calculatedRemainingDays !== undefined) {
      const dailyWage = Number(employee.totalSalary) / 30;
      updateData.leaveValue = Math.max(0, data.calculatedRemainingDays) * dailyWage;
    }

    const updated = await this.prisma.leaveBalance.update({
      where: { id: balance.id },
      data: updateData,
    });

    // Log the correction as a transaction
    if (data.reason) {
      await this.prisma.leaveTransaction.create({
        data: {
          employeeId,
          type: 'ADJUSTMENT',
          days: 0,
          reason: `تصحيح يدوي: ${data.reason}`,
          performedBy: 'admin-correction',
        },
      });
    }

    return { success: true, balance: updated };
  }

  /**
   * Add a new leave transaction and update the balance
   */
  async addTransaction(data: {
    employeeId: string;
    type: string;
    days: number;
    reason?: string;
  }) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: { leaveBalances: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const tx = await this.prisma.leaveTransaction.create({
      data: {
        employeeId: data.employeeId,
        type: data.type as any,
        days: data.days,
        reason: data.reason || '',
        performedBy: 'admin',
      },
    });

    // Update balance
    const balance = employee.leaveBalances[0];
    if (balance) {
      const newRemaining = Number(balance.calculatedRemainingDays) + data.days;
      const dailyWage = Number(employee.totalSalary) / 30;
      const newUsed =
        data.days < 0
          ? Number(balance.annualUsedDays) + Math.abs(data.days)
          : Number(balance.annualUsedDays);

      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          calculatedRemainingDays: newRemaining,
          leaveValue: Math.max(0, newRemaining) * dailyWage,
          annualUsedDays: newUsed,
          lastCalculatedAt: new Date(),
        },
      });
    }

    return { success: true, transaction: tx };
  }

  /**
   * Delete a leave transaction and reverse its effect on the balance
   */
  async deleteTransaction(id: string) {
    const tx = await this.prisma.leaveTransaction.findUnique({
      where: { id },
    });
    if (!tx) throw new NotFoundException('Transaction not found');

    // Reverse the effect on the balance
    const employee = await this.prisma.employee.findUnique({
      where: { id: tx.employeeId },
      include: { leaveBalances: true },
    });

    if (employee) {
      const balance = employee.leaveBalances[0];
      if (balance) {
        const newRemaining =
          Number(balance.calculatedRemainingDays) - Number(tx.days);
        const dailyWage = Number(employee.totalSalary) / 30;
        const newUsed =
          Number(tx.days) < 0
            ? Number(balance.annualUsedDays) - Math.abs(Number(tx.days))
            : Number(balance.annualUsedDays);

        await this.prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            calculatedRemainingDays: newRemaining,
            leaveValue: Math.max(0, newRemaining) * dailyWage,
            annualUsedDays: Math.max(0, newUsed),
            lastCalculatedAt: new Date(),
          },
        });
      }
    }

    await this.prisma.leaveTransaction.delete({ where: { id } });

    return { success: true };
  }

  /**
   * Get full leave history for a single employee with optional month/year filter
   */
  async getEmployeeHistory(
    employeeId: string,
    month?: number,
    year?: number,
  ): Promise<EmployeeLeaveHistoryDto> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        leaveBalances: true,
        leaveTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!employee) throw new NotFoundException('Employee not found');

    // Filter transactions by month/year if provided
    let transactions = employee.leaveTransactions;
    if (month && year) {
      transactions = transactions.filter((tx) => {
        const d = new Date(tx.createdAt);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });
    } else if (year) {
      transactions = transactions.filter(
        (tx) => new Date(tx.createdAt).getFullYear() === year,
      );
    }

    const balance = employee.leaveBalances[0];

    // Build running balance snapshot per transaction (newest first → reverse for running calc)
    const allTx = [...employee.leaveTransactions].reverse(); // oldest first
    let runningBalance = 0;
    const balanceMap = new Map<string, number>();
    for (const tx of allTx) {
      runningBalance += Number(tx.days);
      balanceMap.set(tx.id, Number(runningBalance.toFixed(2)));
    }

    const txDtos = transactions.map((tx) => ({
      id: tx.id,
      employeeId: tx.employeeId,
      employeeName: employee.fullName,
      employeeNumber: employee.employeeNumber,
      type: tx.type,
      days: Number(tx.days),
      reason: tx.reason,
      performedBy: tx.performedBy,
      createdAt: tx.createdAt.toISOString(),
      balanceAfter: balanceMap.get(tx.id) ?? null,
    }));

    return {
      employeeId: employee.id,
      employeeName: employee.fullName,
      employeeNumber: employee.employeeNumber,
      jobTitle: employee.jobTitle,
      branch: employee.branch,
      hireDate: employee.hireDate.toISOString(),
      annualEntitledDays: balance ? Number(balance.annualEntitledDays) : 0,
      annualUsedDays: balance ? Number(balance.annualUsedDays) : 0,
      calculatedRemainingDays: balance
        ? Number(balance.calculatedRemainingDays)
        : 0,
      leaveValue: balance ? Number(balance.leaveValue) : 0,
      transactions: txDtos,
    };
  }

  /**
   * Get leave history for all employees in a company (summary list)
   */
  async getCompanyHistory(
    companyId: string,
    month?: number,
    year?: number,
  ): Promise<{ employees: { id: string; fullName: string; employeeNumber: string; transactionCount: number }[] }> {
    // Date filter
    const dateFilter: any = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      dateFilter.createdAt = { gte: startDate, lt: endDate };
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year + 1, 0, 1);
      dateFilter.createdAt = { gte: startDate, lt: endDate };
    }

    const employees = await this.prisma.employee.findMany({
      where: { companyId, endDate: null },
      include: {
        leaveTransactions: {
          where: Object.keys(dateFilter).length ? dateFilter : undefined,
          select: { id: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    return {
      employees: employees.map((e) => ({
        id: e.id,
        fullName: e.fullName,
        employeeNumber: e.employeeNumber,
        transactionCount: e.leaveTransactions.length,
      })),
    };
  }
}
