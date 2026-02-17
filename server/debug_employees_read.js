
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Fetching employees...');
        const employees = await prisma.employee.findMany({
            include: { leaveBalances: true }
        });
        console.log(`Found ${employees.length} employees.`);

        console.log('Testing enrichment logic...');
        let processed = 0;
        for (const emp of employees) {
            try {
                enrichWithVacationBalance(emp);
                processed++;
            } catch (err) {
                console.error(`FAILED on employee ${emp.id} (${emp.fullName}):`);
                console.error('Data:', JSON.stringify(emp, null, 2));
                console.error('Error:', err.message);
            }
        }
        console.log(`Successfully processed ${processed}/${employees.length} employees.`);

    } catch (error) {
        console.error('Database Connection Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

function enrichWithVacationBalance(employee) {
    // Exact logic from employees.service.ts
    const hireDate = new Date(employee.hireDate);
    const endDate = employee.endDate ? new Date(employee.endDate) : new Date();

    // Check for Invalid Date
    if (isNaN(hireDate.getTime())) {
        throw new Error('Invalid Hire Date');
    }

    const durationInMs = endDate.getTime() - hireDate.getTime();
    const durationInDays = durationInMs / (1000 * 60 * 60 * 24);
    const serviceYears = durationInDays / 365.25;

    let accruedDays = 0;
    if (serviceYears <= 5) {
        accruedDays = serviceYears * 21;
    } else {
        accruedDays = (5 * 21) + ((serviceYears - 5) * 30);
    }

    const usedDays = employee.leaveBalances?.[0]?.annualUsedDays || 0;
    const vacationBalance = Math.max(0, accruedDays - usedDays);

    return {
        ...employee,
        vacationBalance: Number(vacationBalance.toFixed(2)),
        serviceYears: Number(serviceYears.toFixed(2))
    };
}

main();
