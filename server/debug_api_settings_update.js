
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Testing Settings Update APIs ---');

        // 1. Get a company
        const company = await prisma.company.findFirst();
        if (!company) throw new Error('No company found');

        // 2. Create a test branch directly via Prisma (to have something to update)
        const branch = await prisma.branch.create({
            data: { name: 'API Test Branch', companyId: company.id }
        });
        console.log('Created Branch:', branch.id);

        // 3. Test UPDATE via API
        const newName = 'API Test Branch UPDATED';
        console.log(`Updating branch ${branch.id} via API to "${newName}"...`);

        const response = await axios.put(`http://localhost:3000/api/settings/branches/${branch.id}`, {
            name: newName
        });

        console.log('API Response Status:', response.status);
        console.log('API Response Data:', response.data);

        if (response.data.name === newName) {
            console.log('✅ Branch Update Successful');
        } else {
            console.error('❌ Branch Update Failed: Name mismatch');
        }

        // 4. Cleanup
        await prisma.branch.delete({ where: { id: branch.id } });
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('TEST FAILED:', error.message);
        if (error.response) {
            console.error('API Error Data:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
