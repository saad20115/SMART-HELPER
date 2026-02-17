
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const employees = await prisma.employee.findMany();
        console.log('Total Employees:', employees.length);
        if (employees.length > 0) {
            console.log('Sample Employee:', {
                name: employees[0].fullName,
                companyId: employees[0].companyId,
                status: employees[0].status
            });
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
