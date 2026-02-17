import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        const [totalEmployees, companiesCount, branchesCount] = await Promise.all([
            this.prisma.employee.count(),
            this.prisma.company.count(),
            this.prisma.employee.findMany({
                select: { branch: true },
                distinct: ['branch'],
            }).then(items => items.filter(i => i.branch).length),
        ]);

        return {
            totalEmployees,
            companiesCount,
            branchesCount,
            totalSalaries: 1245200, // Placeholder for now or calculate from employees
            eosLiability: "42.5M",   // Placeholder for now
        };
    }

    async getRecentActivity() {
        // Mock recent activity for now, eventually pull from audit logs if they exist
        return [
            { id: 1, type: 'SALARY', title: 'صرف رواتب شهر فبراير', time: 'منذ ساعتين', amount: '-1500', status: 'SUCCESS' },
            { id: 2, type: 'EOS', title: 'تصفية مستحقات خالد', time: 'منذ 4 ساعات', amount: '+3000', status: 'INFO' },
        ];
    }
}
