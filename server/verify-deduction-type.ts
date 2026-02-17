
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting verification for VACATION_EOS_BALANCE deduction type...');

    // 1. Find an employee to assign the deduction to
    const employee = await prisma.employee.findFirst();
    if (!employee) {
        console.error('No employees found to test with.');
        return;
    }
    console.log(`Found employee: ${employee.fullName} (${employee.id})`);

    // 2. Create a deduction with the new type
    try {
        const deduction = await prisma.deduction.create({
            data: {
                employeeId: employee.id,
                // @ts-ignore - locally generated client might not have the type yet if generation failed
                type: 'VACATION_EOS_BALANCE',
                amount: 500,
                description: 'Test Deduction for Vacation Balance',
                status: 'PENDING',
                date: new Date(),
            },
        });
        console.log('Successfully created deduction:', deduction);

        // 3. Verify it was saved correctly
        if (deduction.type !== 'VACATION_EOS_BALANCE') {
            console.error('FAILED: Deduction type mismatch. Expected VACATION_EOS_BALANCE, got:', deduction.type);
        } else {
            console.log('PASSED: Deduction type matches.');
        }

        // 4. Cleanup
        await prisma.deduction.delete({
            where: { id: deduction.id },
        });
        console.log('Cleanup: Deleted test deduction.');

    } catch (error) {
        console.error('Error creating deduction:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
