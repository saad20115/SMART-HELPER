
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to add status column directly via SQL...');
        // Check if column exists first to avoid error
        const result = await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Employee' AND column_name='status') THEN
                    ALTER TABLE "Employee" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
                    RAISE NOTICE 'Added status column to Employee table';
                ELSE
                    RAISE NOTICE 'Column status already exists on Employee table';
                END IF;
            END
            $$;
        `);
        console.log('SQL executed successfully', result);

        // Also check department and classification just in case
        await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Employee' AND column_name='department') THEN
                    ALTER TABLE "Employee" ADD COLUMN "department" TEXT;
                    RAISE NOTICE 'Added department column to Employee table';
                END IF;
            END
            $$;
        `);

        await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Employee' AND column_name='classification') THEN
                    ALTER TABLE "Employee" ADD COLUMN "classification" TEXT;
                    RAISE NOTICE 'Added classification column to Employee table';
                END IF;
            END
            $$;
        `);
        await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Employee' AND column_name='branch') THEN
                    ALTER TABLE "Employee" ADD COLUMN "branch" TEXT;
                    RAISE NOTICE 'Added branch column to Employee table';
                END IF;
            END
            $$;
        `);

    } catch (e) {
        console.error('Error executing SQL:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
