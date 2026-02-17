
import { PrismaClient } from '@prisma/client';
import { LeaveService } from './src/leave/leave.service';

const prisma = new PrismaClient();
const leaveService = new LeaveService(prisma as any);

async function testGetBalances() {
    const company = await prisma.company.findFirst();
    if (!company) {
        console.log('No company found');
        return;
    }

    console.log(`Testing getBalances for company: ${company.name} (${company.id})`);
    const balances = await leaveService.getBalances(company.id);

    console.log(`Found ${balances.length} balances.`);
    if (balances.length > 0) {
        console.log('First 3 balances:');
        console.log(JSON.stringify(balances.slice(0, 3), null, 2));
    }
}

testGetBalances()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
