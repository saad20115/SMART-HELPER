
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { EosCalculationService } from './src/calculations/eos.service';
import { PrismaService } from './src/prisma/prisma.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const eosService = app.get(EosCalculationService);
    const prisma = app.get(PrismaService);

    console.log('Starting EOS Verification...');

    // 1. Create a dummy employee for testing
    // We need a company first
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('No company found. Please create a company first.');
        await app.close();
        return;
    }

    // Create a unique employee number
    const empNum = `TEST-EOS-${Date.now()}`;

    const basicSalary = 5000;
    const totalSalary = 8000; // 5000 basic + 3000 allowances

    const employee = await prisma.employee.create({
        data: {
            companyId: company.id,
            employeeNumber: empNum,
            fullName: 'Test Employee EOS',
            nationalId: `ID-${Date.now()}`,
            jobTitle: 'Tester',
            basicSalary: basicSalary,
            housingAllowance: 2000,
            transportAllowance: 1000,
            otherAllowances: 0,
            totalSalary: totalSalary, // 5000 + 2000 + 1000
            hireDate: new Date('2020-01-01'), // > 5 years service (approx 6 years)
            status: 'active'
        }
    });

    console.log(`Created test employee: ${employee.id} with Basic: ${basicSalary}, Total: ${totalSalary}`);

    try {
        // 2. Test EOS Calculation
        // Set end date to today to simulate termination
        await prisma.employee.update({
            where: { id: employee.id },
            data: { endDate: new Date(), terminationType: 'TERMINATION' }
        });

        const result = await eosService.calculateEOS(employee.id);

        console.log('--- Calculation Result ---');
        console.log(`Service Years: ${result.serviceYears}`);
        console.log(`Gross EOS: ${result.grossEOS}`);
        console.log(`Leave Compensation: ${result.leaveCompensation}`);

        // Verification Logic
        // Service Years approx 6.13 (from Jan 2020 to Feb 2026)
        // Expected Gross EOS formula:
        // First 5 years: 5 * 0.5 * Salary
        // Remaining years: (ServiceYears - 5) * 1.0 * Salary

        const serviceYears = Number(result.serviceYears);
        const first5 = 5 * 0.5; // 2.5
        const remaining = (serviceYears - 5) * 1.0;
        const totalMultiples = first5 + remaining;

        // Check if it used Basic or Total
        const expectedGrossUsingBasic = totalMultiples * basicSalary;
        const expectedGrossUsingTotal = totalMultiples * totalSalary;

        const actualGross = Number(result.grossEOS);

        console.log(`Expected Multiplier: ${totalMultiples.toFixed(2)}`);
        console.log(`Expected Gross (using Basic ${basicSalary}): ${expectedGrossUsingBasic.toFixed(2)}`);
        console.log(`Expected Gross (using Total ${totalSalary}): ${expectedGrossUsingTotal.toFixed(2)}`);
        console.log(`Actual Gross: ${actualGross.toFixed(2)}`);

        if (Math.abs(actualGross - expectedGrossUsingBasic) < 5) {
            console.log('SUCCESS: EOS is calculated based on Basic Salary.');
        } else if (Math.abs(actualGross - expectedGrossUsingTotal) < 5) {
            console.log('WARNING: EOS is currently calculated based on Total Salary (Change Required).');
        } else {
            console.log('FAILURE: EOS calculation does not match either Basic or Total salary logic.');
        }


        // Verify Leave Compensation (Should be Total Salary)
        // Employee has no leave balance initially, so let's add some
        await prisma.leaveBalance.create({
            data: {
                employeeId: employee.id,
                annualEntitledDays: 30,
                annualUsedDays: 0,
                calculatedRemainingDays: 10,
                leaveValue: 0
            }
        });

        // Recalculate with leave balance
        const resultWithLeave = await eosService.calculateEOS(employee.id);
        const leaveComp = Number(resultWithLeave.leaveCompensation);

        const expectedLeaveComp = (totalSalary / 30) * 10;
        console.log(`Expected Leave Comp (on Total): ${expectedLeaveComp.toFixed(2)}`);
        console.log(`Actual Leave Comp: ${leaveComp.toFixed(2)}`);

        if (Math.abs(leaveComp - expectedLeaveComp) < 1) {
            console.log('SUCCESS: Leave Compensation is based on Total Salary.');
        } else {
            console.log('FAILURE: Leave Compensation calculation issue.');
        }


    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        // Cleanup
        console.log('Cleaning up...');
        try {
            await prisma.leaveBalance.deleteMany({ where: { employeeId: employee.id } });
            await prisma.employee.delete({ where: { id: employee.id } });
        } catch (e) {
            console.error('Cleanup failed', e);
        }
        await app.close();
        console.log('Verification Complete.');
    }
}

bootstrap();
