
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const searchTerm = 'غازي'; // Arabic search
    console.log(`Searching for '${searchTerm}'...`);

    const employees = await prisma.employee.findMany({
        where: {
            fullName: {
                contains: searchTerm,
            },
        },
        include: {
            leaveTransactions: true,
        },
    });

    if (employees.length === 0) {
        console.log('No employee found with that name. Trying English...');
        const employeesEn = await prisma.employee.findMany({
            where: {
                fullName: {
                    contains: 'Ghazi',
                    mode: 'insensitive'
                },
            },
            include: {
                leaveTransactions: true,
            },
        });
        if (employeesEn.length > 0) {
            dumpEmployee(employeesEn[0]);
        } else {
            console.log('Still nothing found.');
        }
    } else {
        employees.forEach(dumpEmployee);
    }
}

function dumpEmployee(employee: any) {
    console.log('--------------------------------------------------');
    console.log(`Employee: ${employee.fullName} (${employee.employeeNumber})`);
    console.log(`Hire Date: ${employee.hireDate}`);
    console.log(`End Date: ${employee.endDate}`);

    const startDate = new Date(employee.hireDate);
    const endDate = employee.endDate ? new Date(employee.endDate) : new Date();
    const serviceDurationMs = endDate.getTime() - startDate.getTime();
    const serviceYears = serviceDurationMs / (1000 * 60 * 60 * 24 * 365.25);

    console.log(`Service Years: ${serviceYears.toFixed(4)}`);

    let accruedDays = 0;
    if (serviceYears < 5) {
        accruedDays = serviceYears * 21;
    } else {
        accruedDays = 5 * 21 + (serviceYears - 5) * 30;
    }
    console.log(`Accrued Days (Calculated): ${accruedDays.toFixed(4)}`);

    const transactions = employee.leaveTransactions || [];
    const manualAdjustments = transactions
        .filter((tx: any) => tx.type === 'ADJUSTMENT')
        .reduce((sum: number, tx: any) => sum + Number(tx.days), 0);

    const manualUses = transactions
        .filter((tx: any) => tx.type === 'USAGE')
        .reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.days)), 0);

    console.log(`Manual Adjustments: ${manualAdjustments}`);
    console.log(`Manual Uses: ${manualUses}`);

    const leaveBalanceDays = accruedDays + manualAdjustments - manualUses;
    console.log(`Leave Balance Days (Calculated): ${leaveBalanceDays.toFixed(4)}`);
    console.log('--------------------------------------------------');
}

main()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
