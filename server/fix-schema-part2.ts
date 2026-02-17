
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to add remaining columns...');

        await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
                -- Add department
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Employee' AND column_name='department') THEN
                    ALTER TABLE "Employee" ADD COLUMN "department" TEXT;
                    RAISE NOTICE 'Added department column';
                END IF;

                -- Add classification
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Employee' AND column_name='classification') THEN
                    ALTER TABLE "Employee" ADD COLUMN "classification" TEXT;
                    RAISE NOTICE 'Added classification column';
                END IF;

                -- Add branch
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Employee' AND column_name='branch') THEN
                    ALTER TABLE "Employee" ADD COLUMN "branch" TEXT;
                    RAISE NOTICE 'Added branch column';
                END IF;
            END
            $$;
        `);
        console.log('Columns added successfully');

    } catch (e) {
        console.error('Error executing SQL:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
