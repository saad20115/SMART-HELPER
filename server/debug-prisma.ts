
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing findMany with include...');
        const employees = await prisma.employee.findMany({
            include: {
                deductions: true,
                leaveBalances: true,
                leaveTransactions: true
            }
        });
        console.log(`Found ${employees.length} employees`);
    } catch (e) {
        console.error('Error executing query:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
