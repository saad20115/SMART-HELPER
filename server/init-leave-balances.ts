
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initLeaveBalances() {
    console.log('--- Initializing Leave Balances for All Employees ---');

    const employees = await prisma.employee.findMany({
        include: {
            leaveBalances: true,
        }
    });

    console.log(`Processing ${employees.length} employees...`);
    let createdCount = 0;
    let skippedCount = 0;

    for (const emp of employees) {
        if (emp.leaveBalances.length === 0) {
            // Calculate initial accrual
            const hireDate = new Date(emp.hireDate);
            const today = new Date();
            const diffTime = today.getTime() - hireDate.getTime();
            const serviceYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
            const accruedDays = serviceYears < 5 ? serviceYears * 21 : 5 * 21 + (serviceYears - 5) * 30;

            const annualEntitledDays = serviceYears < 5 ? 21 : 30;
            const dailyWage = Number(emp.totalSalary) / 30;
            const leaveValue = accruedDays * dailyWage;

            await prisma.leaveBalance.create({
                data: {
                    employeeId: emp.id,
                    annualEntitledDays,
                    annualUsedDays: 0,
                    calculatedRemainingDays: Number(accruedDays.toFixed(2)),
                    leaveValue: Number(leaveValue.toFixed(2)),
                    lastCalculatedAt: new Date(),
                }
            });
            createdCount++;
        } else {
            skippedCount++;
        }
    }

    console.log(`\nInitialization Complete:`);
    console.log(`- Created: ${createdCount}`);
    console.log(`- Already existed: ${skippedCount}`);
}

initLeaveBalances()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
