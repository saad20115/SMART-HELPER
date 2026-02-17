
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Testing Branch Operations ---');
        // 1. Get a company first
        const company = await prisma.company.findFirst();
        if (!company) throw new Error('No company found to attach branch to');
        console.log('Using company:', company.id);

        const branchName = 'Test Branch ' + Date.now();
        console.log(`Creating branch: ${branchName}`);
        const newBranch = await prisma.branch.create({
            data: {
                name: branchName,
                companyId: company.id
            }
        });
        console.log('Created:', newBranch);

        // 2. Update
        console.log(`Updating branch...`);
        const updatedBranch = await prisma.branch.update({
            where: { id: newBranch.id },
            data: { name: branchName + ' Updated' }
        });
        console.log('Updated:', updatedBranch);

        // 3. Delete
        console.log(`Deleting branch...`);
        await prisma.branch.delete({
            where: { id: newBranch.id }
        });
        console.log('Deleted successfully.');

        console.log('\n--- Testing Company Operations ---');
        // 1. Create Company
        // Need to check specific schema fields for Company
        const companyName = 'Test Company ' + Date.now();
        console.log(`Creating company: ${companyName}`);
        const newCompany = await prisma.company.create({
            data: {
                name: companyName,
                crNumber: '1234567890',
                email: 'test@example.com'
            }
        });
        console.log('Created:', newCompany);

        // 2. Delete Company
        console.log('Deleting company...');
        await prisma.company.delete({ where: { id: newCompany.id } });
        console.log('Deleted successfully.');

    } catch (error) {
        console.error('OPERATION FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
