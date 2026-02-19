
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAggregation() {
    const employees = await prisma.employee.findMany({
        include: {
            deductions: true,
            leaveBalances: true,
            leaveTransactions: true
        }
    });

    console.log(`Total Employees: ${employees.length}`);

    let totalGrossEOS = 0;
    let totalNetEOS = 0;
    let totalLeave = 0;
    let totalDeductions = 0;
    let totalFinalPayable = 0;

    const highDeductionEmployees: { name: string; d: number; netEOS: number; final: number; detail: string }[] = [];

    for (const emp of employees) {
        // Service Years
        const start = new Date(emp.hireDate);
        const end = emp.endDate ? new Date(emp.endDate) : new Date();
        const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

        // Basic Salary
        const basicSalary = Number(emp.basicSalary);
        const totalSalary = Number(emp.totalSalary);

        // Gross EOS
        let gross = 0;
        if (years <= 5) gross = years * 0.5 * basicSalary;
        else gross = (5 * 0.5 * basicSalary) + ((years - 5) * 1.0 * basicSalary);

        // Ratio
        let ratio = 1.0;
        // Apply entitlement ratio based on termination type
        const terminationType = (emp as any).terminationType;
        let entitlementRatio = 1.0;

        if (terminationType === 'RESIGNATION') {
            if (years < 2) ratio = 0;
            else if (years < 5) ratio = 1 / 3;
            else if (years < 10) ratio = 2 / 3;
            else ratio = 1.0;
        } else if (terminationType === 'TERMINATION' || terminationType === 'CONTRACT_END') {
            ratio = 1.0;
        }

        if (ratio < 1.0) {
            console.log(`Debug: Emp ${emp.fullName}, Type=${terminationType}, Years=${years}, Ratio=${ratio}`);
        }

        const net = gross * ratio;

        // Leave
        let accruedDays = 0;
        if (years < 5) accruedDays = years * 21;
        else accruedDays = (5 * 21) + ((years - 5) * 30);

        const txs = (emp as any).leaveTransactions || [];
        const adj = txs.filter((t: any) => t.type === 'ADJUSTMENT').reduce((s: number, t: any) => s + Number(t.days), 0);
        const used = txs.filter((t: any) => t.type === 'USAGE').reduce((s: number, t: any) => s + Math.abs(Number(t.days)), 0);
        const balanceDays = Math.max(0, accruedDays + adj - used);

        const dailyWage = totalSalary / 30;
        const leaveComp = balanceDays * dailyWage;

        // Deductions
        const empDeductions = (emp as any).deductions
            .filter((d: any) => d.status === 'PENDING')
            .reduce((s: number, d: any) => s + Number(d.amount), 0);

        const detail = (emp as any).deductions.filter((d: any) => d.status === 'PENDING').map((d: any) => `${d.type}: ${d.amount}`).join(', ');

        const final = net + leaveComp - empDeductions;

        totalGrossEOS += gross;
        totalNetEOS += net;
        totalLeave += leaveComp;
        totalDeductions += empDeductions;
        totalFinalPayable += final;

        if (empDeductions > 1000) {
            highDeductionEmployees.push({
                name: emp.fullName,
                d: empDeductions,
                netEOS: net,
                final: final,
                detail
            });
        }
    }

    console.log('--- Aggregation Results ---');
    console.log(`Total Gross EOS: ${totalGrossEOS.toLocaleString()}`);
    console.log(`Total Net EOS: ${totalNetEOS.toLocaleString()}`);
    console.log(`Total Leave Comp: ${totalLeave.toLocaleString()}`);
    console.log(`Total Deductions: ${totalDeductions.toLocaleString()}`);
    console.log(`Total Final Payable: ${totalFinalPayable.toLocaleString()}`);
    console.log(`Check: NetEOS + Leave - Ded = ${(totalNetEOS + totalLeave - totalDeductions).toLocaleString()}`);
    console.log(`Difference: ${Math.abs(totalFinalPayable - (totalNetEOS + totalLeave - totalDeductions)).toLocaleString()}`);

    console.log('\n--- High Deductions ---');
    highDeductionEmployees.sort((a, b) => b.d - a.d).slice(0, 10).forEach(e => {
        console.log(`${e.name}: Ded=${e.d.toLocaleString()} (${e.detail}), NetEOS=${e.netEOS.toLocaleString()}, Final=${e.final.toLocaleString()}`);
    });
}

verifyAggregation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
