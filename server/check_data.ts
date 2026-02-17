
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const companies = await prisma.company.findMany();
        console.log('Companies:', companies);

        const employees = await prisma.employee.findMany();
        console.log(`Employees count: ${employees.length}`);
        employees.forEach(e => console.log(`- ${e.fullName} (${e.employeeNumber})`));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
