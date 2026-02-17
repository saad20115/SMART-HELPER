import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats(companyId?: string) {
        const employeeWhere: Prisma.EmployeeWhereInput = companyId ? { companyId } : {};

        const totalEmployees = await this.prisma.employee.count({ where: employeeWhere });
        const companiesCount = await this.prisma.company.count();

        // Branches from settings (Branch table)
        const branchWhere: Prisma.BranchWhereInput = companyId ? { companyId } : {};
        const branchesCount = await this.prisma.branch.count({ where: branchWhere });

        // Jobs from settings
        const jobWhere: Prisma.JobWhereInput = companyId ? { companyId } : {};
        const jobsCount = await this.prisma.job.count({ where: jobWhere });

        // Classifications from settings
        const classWhere: Prisma.ClassificationWhereInput = companyId ? { companyId } : {};
        const classificationsCount = await this.prisma.classification.count({ where: classWhere });

        // Salary and EOS calculations
        const employees = await this.prisma.employee.findMany({
            where: employeeWhere,
            select: { totalSalary: true, basicSalary: true, housingAllowance: true, transportAllowance: true, otherAllowances: true, hireDate: true },
        });

        const totalSalaries = employees.reduce((sum, emp) => sum + Number(emp.totalSalary || 0), 0);

        // EOS Liability approximation
        const eosLiabilityVal = employees.reduce((sum, emp) => {
            const years = (new Date().getTime() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            const basic = Number(emp.basicSalary || 0);
            if (years <= 5) return sum + (years * 0.5 * basic);
            return sum + (5 * 0.5 * basic) + ((years - 5) * basic);
        }, 0);

        // Salary breakdown for chart
        const chartData = {
            basicSalary: employees.reduce((s, e) => s + Number(e.basicSalary || 0), 0),
            housingAllowance: employees.reduce((s, e) => s + Number(e.housingAllowance || 0), 0),
            transportAllowance: employees.reduce((s, e) => s + Number(e.transportAllowance || 0), 0),
            otherAllowances: employees.reduce((s, e) => s + Number(e.otherAllowances || 0), 0),
        };

        return {
            totalEmployees,
            companiesCount,
            branchesCount,
            jobsCount,
            classificationsCount,
            totalSalaries,
            eosLiability: eosLiabilityVal.toLocaleString('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }),
            salaryChart: chartData,
        };
    }

    async getRecentActivity(companyId?: string) {
        const employeeFilter = companyId
            ? { employee: { companyId } }
            : {};

        const recentDeductions = await this.prisma.deduction.findMany({
            where: employeeFilter,
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { employee: { select: { fullName: true } } },
        });

        const recentLeaves = await this.prisma.leaveTransaction.findMany({
            where: employeeFilter,
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { employee: { select: { fullName: true } } },
        });

        const deductionLabels: Record<string, string> = {
            LOAN: '\u0633\u0644\u0641\u0629',
            PENALTY: '\u062c\u0632\u0627\u0621',
            ADVANCE: '\u062f\u0641\u0639\u0629 \u0645\u0642\u062f\u0645\u0629',
            OTHER: '\u0623\u062e\u0631\u0649',
            VACATION_EOS_BALANCE: '\u0631\u0635\u064a\u062f \u0625\u062c\u0627\u0632\u0627\u062a/\u0646\u0647\u0627\u064a\u0629 \u062e\u062f\u0645\u0629',
        };

        const leaveLabels: Record<string, string> = {
            ACCRUAL: '\u0627\u0633\u062a\u062d\u0642\u0627\u0642 \u0625\u062c\u0627\u0632\u0629',
            USAGE: '\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0625\u062c\u0627\u0632\u0629',
            ADJUSTMENT: '\u062a\u0639\u062f\u064a\u0644 \u0631\u0635\u064a\u062f',
            ENCASHMENT: '\u0635\u0631\u0641 \u0631\u0635\u064a\u062f',
        };

        const activities = [
            ...recentDeductions.map((d) => ({
                id: d.id,
                type: 'DEDUCTION' as const,
                title: `${deductionLabels[d.type] || d.type} - ${d.employee?.fullName || '\u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0641'}`,
                time: d.createdAt.toISOString(),
                amount: `-${Number(d.amount).toFixed(2)} \u0631.\u0633`,
                status: 'WARNING' as const,
            })),
            ...recentLeaves.map((l) => ({
                id: l.id,
                type: 'LEAVE' as const,
                title: `${leaveLabels[l.type] || l.type} - ${l.employee?.fullName || '\u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0641'}`,
                time: l.createdAt.toISOString(),
                amount: `${Number(l.days).toFixed(1)} \u064a\u0648\u0645`,
                status: (Number(l.days) >= 0 ? 'SUCCESS' : 'WARNING') as 'SUCCESS' | 'WARNING',
            })),
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

        return activities;
    }
}
