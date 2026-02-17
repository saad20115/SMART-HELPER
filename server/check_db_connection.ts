
// check_db_connection.ts
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    console.log('Attempting to connect to database...');
    try {
        await prisma.$connect();
        console.log('Successfully connected to database!');
        const count = await prisma.company.count();
        console.log(`Connection verified. Found ${count} companies.`);
    } catch (error) {
        console.error('Failed to connect to database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
