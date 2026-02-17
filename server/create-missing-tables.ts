
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to create missing tables...');

        // Create Branch Table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Branch" (
                "id" TEXT NOT NULL,
                "companyId" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
            );
        `);
        console.log('Branch table created/verified');

        // Create Job Table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Job" (
                "id" TEXT NOT NULL,
                "companyId" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
            );
        `);
        console.log('Job table created/verified');

        // Create Classification Table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Classification" (
                "id" TEXT NOT NULL,
                "companyId" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "Classification_pkey" PRIMARY KEY ("id")
            );
        `);
        console.log('Classification table created/verified');

        // Add Unique constraints and Foreign Keys if they don't exist (simplified check)
        // We will skip complex FK setup via raw SQL for now as Prisma handles it better if migrate works.
        // But since migrate/push is failing/stuck, we at least need the tables for the app to not crash.

    } catch (e) {
        console.error('Error executing SQL:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
