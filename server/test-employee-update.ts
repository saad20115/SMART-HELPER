
import { PrismaClient } from '@prisma/client';
import { EmployeesService } from './src/employees/employees.service';
import { LeaveService } from './src/leave/leave.service';

const prisma = new PrismaClient();
const leaveService = new LeaveService(prisma as any);
const employeesService = new EmployeesService(prisma as any, leaveService);

async function testUpdate() {
    const employee = await prisma.employee.findFirst();
    if (!employee) {
        console.log('No employee found to test update');
        return;
    }

    console.log(`Testing update for employee: ${employee.fullName} (${employee.id})`);

    try {
        const updateData = {
            fullName: employee.fullName + ' (Updated)',
            vacationBalance: 100, // This should be ignored by Prisma
            endServiceReason: 'Test reason', // This should be ignored by Prisma
        };

        const result = await employeesService.update(employee.id, updateData as any);
        console.log('Update successful!');
        console.log('Updated Name:', result.fullName);
        console.log('Vacation Balance (from enrichment):', result.vacationBalance);

        // Cleanup
        await prisma.employee.update({
            where: { id: employee.id },
            data: { fullName: employee.fullName }
        });
        console.log('Cleanup successful.');

    } catch (error) {
        console.error('Update failed:', error);
    }
}

testUpdate()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
