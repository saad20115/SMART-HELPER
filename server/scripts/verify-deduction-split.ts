import { PrismaClient } from '@prisma/client';
import { EosCalculationService } from '../src/calculations/eos.service';

const prisma = new PrismaClient();
const eosService = new EosCalculationService(prisma as any);

async function verifyDeductionSplit() {
    try {
        console.log('Verifying deduction split logic...');

        // Find an employee with both types of deductions if possible, or create a mock scenario if needed.
        // For now, let's just run the aggregation and check if the totals sum up correctly.

        const result = await eosService.calculateAggregatedEntitlements({});

        console.log('Aggregated Totals:');
        console.log(`Total Leave Deductions: ${result.summary.totalLeaveDeductions}`);
        console.log(`Total Other Deductions: ${result.summary.totalOtherDeductions}`);
        console.log(`Total Deductions: ${result.summary.totalDeductions}`);

        const sumOfSplits = result.summary.totalLeaveDeductions + result.summary.totalOtherDeductions;
        const difference = Math.abs(sumOfSplits - result.summary.totalDeductions);

        if (difference < 0.01) {
            console.log('SUCCESS: Total Deductions match the sum of splits.');
        } else {
            console.error(`FAILURE: Total Deductions (${result.summary.totalDeductions}) does not match sum of splits (${sumOfSplits}).`);
        }

        // Check individual employees
        console.log('\nChecking individual employees...');
        let errorCount = 0;
        let negativeBalanceCount = 0;

        for (const emp of result.employees) {
            if (emp.leaveBalanceDays < 0) {
                negativeBalanceCount++;
                console.log(`Found employee with negative balance: ${emp.fullName}, Balance: ${emp.leaveBalanceDays}, Deduction: ${emp.leaveDeductions}`);
            }

            const empSum = emp.leaveDeductions + emp.otherDeductions;
            const empDiff = Math.abs(empSum - emp.totalDeductions);
            if (empDiff > 0.01) {
                console.error(`Mismatch for employee ${emp.fullName}: Leave=${emp.leaveDeductions}, Other=${emp.otherDeductions}, Total=${emp.totalDeductions}`);
                errorCount++;
            }
        }

        console.log(`\nTotal employees with negative leave balance: ${negativeBalanceCount}`);

        if (errorCount === 0) {
            console.log('SUCCESS: All individual employee deduction splits match their totals.');
        } else {
            console.error(`FAILURE: ${errorCount} employees have mismatched deduction splits.`);
        }

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyDeductionSplit();
