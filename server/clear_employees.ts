
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Deleting all employees...');
        const deleteEmployees = await prisma.employee.deleteMany({});
        console.log(`Deleted ${deleteEmployees.count} employees.`);

        // Checking if company exists
        const companies = await prisma.company.findMany();
        console.log(`Remaining companies: ${companies.length}. You can use existing company or create new one.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
