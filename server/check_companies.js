
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const companies = await prisma.company.findMany();
        console.log('Companies count:', companies.length);
        if (companies.length > 0) {
            console.log('Use this companyId for test:', companies[0].id);
        } else {
            console.log('No companies found!');
        }
    } catch (error) {
        console.error('Error connecting to DB:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
