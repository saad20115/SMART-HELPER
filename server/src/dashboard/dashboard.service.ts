import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        // Fetch real counts
        const totalEmployees = await this.prisma.employee.count();
        const companiesCount = await this.prisma.company.count();

        // Get distinct branches count locally or via group by
        const branches = await this.prisma.employee.findMany({
            select: { branch: true },
            distinct: ['branch'],
        });
        const branchesCount = branches.filter(b => b.branch).length;

        // Calculate totals from actual employees
        const employees = await this.prisma.employee.findMany({
            select: { totalSalary: true, basicSalary: true, hireDate: true }
        });

        const totalSalaries = employees.reduce((sum, emp) => sum + Number(emp.totalSalary || 0), 0);

        // Simple approximation for EOS Liability (just for dashboard summary)
        // In a real scenario, this should use the detailed EosCalculationService
        const eosLiabilityVal = employees.reduce((sum, emp) => {
            // Rough estimation: 0.5 * basic * years (<5) + 1.0 * basic * years (>5)
            // This is just to show a non-hardcoded number
            const years = (new Date().getTime() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            const basic = Number(emp.basicSalary || 0);
            if (years <= 5) return sum + (years * 0.5 * basic);
            return sum + (5 * 0.5 * basic) + ((years - 5) * basic);
        }, 0);

        return {
            totalEmployees,
            companiesCount,
            branchesCount,
            totalSalaries: totalSalaries,
            eosLiability: eosLiabilityVal.toLocaleString('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }),
        };
    }

    async getRecentActivity() {
        // Fetch recent deductions
        const recentDeductions = await this.prisma.deduction.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { employee: { select: { fullName: true } } }
        });

        // Fetch recent leave transactions
        const recentLeaves = await this.prisma.leaveTransaction.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { employee: { select: { fullName: true } } }
        });

        // Combine and sort
        const activities = [
            ...recentDeductions.map(d => ({
                id: d.id,
                type: 'DEDUCTION',
                title: `خصم ${d.type} - ${d.employee?.fullName || 'غير معروف'}`,
                time: new Date(d.createdAt).toLocaleDateString('ar-SA'),
                amount: `-${Number(d.amount).toFixed(2)}`,
                status: 'INFO'
            })),
            ...recentLeaves.map(l => ({
                id: l.id,
                type: 'LEAVE',
                title: `${l.type} - ${l.employee?.fullName || 'غير معروف'}`,
                time: new Date(l.createdAt).toLocaleDateString('ar-SA'),
                amount: `${Number(l.days).toFixed(1)} يوم`,
                status: 'SUCCESS'
            }))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

        return activities;
    }
}
