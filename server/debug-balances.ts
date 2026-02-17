
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugBalances() {
    console.log('--- Debugging Leave Balances ---');

    const employees = await prisma.employee.findMany({
        include: {
            leaveBalances: true,
            leaveTransactions: true,
        }
    });

    if (employees.length === 0) {
        console.log('No employees found.');
        return;
    }

    for (const emp of employees) {
        console.log(`\nEmployee: ${emp.fullName} (ID: ${emp.id})`);
        console.log(`- Hire Date: ${emp.hireDate}`);
        console.log(`- Total Salary: ${emp.totalSalary}`);

        // Simulate calculateServiceYears
        const today = new Date();
        const hireDate = new Date(emp.hireDate);
        const diffTime = today.getTime() - hireDate.getTime();
        const serviceYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        console.log(`- Calculated Service Years: ${serviceYears.toFixed(4)}`);

        // Simulate calculateCurrentBalance logic
        const accruedDays = serviceYears < 5 ? serviceYears * 21 : 5 * 21 + (serviceYears - 5) * 30;
        console.log(`- Accrued Days from Hire Date: ${accruedDays.toFixed(4)}`);

        const manualAdjustments = emp.leaveTransactions
            .filter(tx => tx.type === 'ADJUSTMENT' || tx.type === 'ACCRUAL')
            .reduce((sum, tx) => sum + Number(tx.days), 0);

        const manualUses = emp.leaveTransactions
            .filter(tx => tx.type === 'USAGE')
            .reduce((sum, tx) => sum + Math.abs(Number(tx.days)), 0);

        console.log(`- Transactions (ADJUSTMENT/ACCRUAL): ${manualAdjustments}`);
        console.log(`- Transactions (USAGE): ${manualUses}`);

        const finalCalculatedBalance = Math.max(0, accruedDays + manualAdjustments - manualUses);
        console.log(`- Final Calculated Balance (LIVE): ${finalCalculatedBalance.toFixed(4)}`);

        if (emp.leaveBalances.length > 0) {
            console.log(`- DB LeaveBalance.calculatedRemainingDays: ${emp.leaveBalances[0].calculatedRemainingDays}`);
            console.log(`- DB LeaveBalance.annualUsedDays: ${emp.leaveBalances[0].annualUsedDays}`);
        } else {
            console.log('- No LeaveBalance record found in DB.');
        }
    }
}

debugBalances()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
