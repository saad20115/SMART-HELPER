
// test_import.ts
import { PrismaService } from './src/prisma/prisma.service';
import { ImportExportService } from './src/import-export/import-export.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock Multer File
const mockFile = {
    fieldname: 'file',
    originalname: 'test_employees.xlsx',
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: fs.readFileSync(path.join(__dirname, 'test_template.xlsx')),
    size: 1000
} as any; // Cast to avoid full interface implementation

async function runTest() {
    const prisma = new PrismaService();
    // Ensure connection
    await prisma.$connect();

    const service = new ImportExportService(prisma);

    console.log('Starting import test...');

    // Get a valid company ID
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('No company found to test with.');
        return;
    }
    console.log(`Using company: ${company.name} (${company.id})`);

    try {
        const result = await service.importEmployees(
            mockFile,
            company.id,
            'test-user-id'
        );
        console.log('Import Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Import Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
