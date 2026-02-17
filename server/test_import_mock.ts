
// test_import_mock.ts
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
} as any;

// Mock PrismaService
const mockPrisma = {
    importLog: {
        create: async () => ({ id: 'log-123' }),
        update: async () => ({}),
    },
    importError: {
        create: async () => ({}),
    },
    employee: {
        findFirst: async () => null, // No duplicate
        create: async () => ({}),
    },
    $connect: async () => { },
    $disconnect: async () => { },
} as any;

async function runTest() {
    console.log('Starting mocked import test...');

    const service = new ImportExportService(mockPrisma);

    try {
        const result = await service.importEmployees(
            mockFile,
            'company-123',
            'user-123'
        );
        console.log('Success! Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Test Failed with Error:', error);
    }
}

runTest();
