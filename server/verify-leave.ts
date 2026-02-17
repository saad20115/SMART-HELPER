
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { LeaveService } from './src/leave/leave.service';
import { PrismaService } from './src/prisma/prisma.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const leaveService = app.get(LeaveService);
    const prisma = app.get(PrismaService);

    console.log('Starting Verification...');

    // 1. Create a dummy employee for testing
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('No company found. Please create a company first.');
        await app.close();
        return;
    }

    const employee = await prisma.employee.create({
        data: {
            companyId: company.id,
            employeeNumber: 'TEST001',
            fullName: 'Test Employee Leave',
            nationalId: '1234567890',
            jobTitle: 'Tester',
            basicSalary: 5000,
            housingAllowance: 1000,
            transportAllowance: 500,
            otherAllowances: 0,
            totalSalary: 6500,
            hireDate: new Date('2020-01-01'), // > 5 years service
            status: 'active'
        }
    });

    console.log(`Created test employee: ${employee.id}`);

    try {
        // 2. Test Recalculate Accruals
        console.log('Testing Recalculate Accruals...');
        await leaveService.recalculateAccruals(employee.id);

        let balances = await leaveService.getBalances(company.id);
        let empBalance = balances.find(b => b.employeeId === employee.id);
        if (!empBalance) throw new Error('Balance not found for employee');

        if (empBalance) {
            console.log(`Service Years: ${empBalance.serviceYears}`);
            console.log(`Annual Entitled Days: ${empBalance.annualEntitledDays}`);

            if (empBalance.annualEntitledDays === 30) {
                console.log('SUCCESS: Entitlement correctly set to 30 days for > 5 years service.');
            } else {
                console.error(`FAILURE: Entitlement is ${empBalance.annualEntitledDays}, expected 30.`);
            }
        } else {
            console.error('FAILURE: Balance not found for employee.');
        }

        // 3. Test Manual Adjustment (Add)
        console.log('Testing Manual Adjustment (Add 5 days)...');
        await leaveService.adjustBalance({
            employeeId: employee.id,
            days: 5,
            reason: 'Test Addition',
            type: 'IsManualAdjustment'
        }, 'system-test');

        balances = await leaveService.getBalances(company.id);
        empBalance = balances.find(b => b.employeeId === employee.id);

        if (empBalance) {
            console.log(`Remaining Days: ${empBalance.calculatedRemainingDays}`);

            if (empBalance.calculatedRemainingDays === 5) {
                console.log('SUCCESS: Balance updated correctly after addition.');
            } else {
                console.error(`FAILURE: Balance is ${empBalance.calculatedRemainingDays}, expected 5.`);
            }
        } else {
            console.error('FAILURE: Balance not found after addition.');
        }

        // 4. Test Manual Adjustment (Deduct)
        console.log('Testing Manual Adjustment (Deduct 2 days)...');
        await leaveService.adjustBalance({
            employeeId: employee.id,
            days: -2,
            reason: 'Test Deduction',
            type: 'IsManualAdjustment'
        }, 'system-test');

        balances = await leaveService.getBalances(company.id);
        empBalance = balances.find(b => b.employeeId === employee.id);

        if (empBalance) {
            console.log(`Remaining Days: ${empBalance.calculatedRemainingDays}`);

            if (empBalance.calculatedRemainingDays === 3) {
                console.log('SUCCESS: Balance updated correctly after deduction.');
            } else {
                console.error(`FAILURE: Balance is ${empBalance.calculatedRemainingDays}, expected 3.`);
            }
        } else {
            console.error('FAILURE: Balance not found after deduction.');
        }


    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        // Cleanup
        console.log('Cleaning up...');
        await prisma.leaveTransaction.deleteMany({ where: { employeeId: employee.id } });
        await prisma.leaveBalance.deleteMany({ where: { employeeId: employee.id } });
        await prisma.employee.delete({ where: { id: employee.id } });
        await app.close();
        console.log('Verification Complete.');
    }
}

bootstrap();
