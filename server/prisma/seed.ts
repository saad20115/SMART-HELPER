import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create or Update Default Company
    const company = await prisma.company.upsert({
        where: { crNumber: '1010101010' },
        update: {},
        create: {
            name: 'My Company',
            crNumber: '1010101010',
            email: 'info@mycompany.com',
            phone: '0500000000',
        },
    });

    console.log('Created/Found company:', company.id);

    // Create Admin User
    const adminEmail = 'admin@example.com';
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            companyId: company.id,
            name: 'Admin User',
            email: adminEmail,
            // Example hash for password123
            passwordHash: '$2b$10$EpWaTuscQXtFw3Jwbca.l.D8.Z8.Z8.Z8.Z8.Z8.Z8.Z8.Z8.Z8',
            role: Role.ADMIN,
        },
    });

    console.log('Created/Found user:', adminEmail);

    // Create Employees to populate Branches and Jobs
    console.log('Seeding employees...');

    const employeesData = [
        {
            companyId: company.id,
            employeeNumber: 'EMP001',
            fullName: 'محمد علي',
            nationalId: '1000000001',
            jobTitle: 'مهندس برمجيات',
            branch: 'الرياض',
            basicSalary: 8000,
            housingAllowance: 2000,
            transportAllowance: 500,
            otherAllowances: 0,
            totalSalary: 10500,
            hireDate: new Date('2024-01-01'),
        },
        {
            companyId: company.id,
            employeeNumber: 'EMP002',
            fullName: 'سارة أحمد',
            nationalId: '1000000002',
            jobTitle: 'مدير مشروع',
            branch: 'جدة',
            basicSalary: 12000,
            housingAllowance: 3000,
            transportAllowance: 1000,
            otherAllowances: 500,
            totalSalary: 16500,
            hireDate: new Date('2023-06-01'),
        },
        {
            companyId: company.id,
            employeeNumber: 'EMP003',
            fullName: 'خالد عمر',
            nationalId: '1000000003',
            jobTitle: 'محاسب',
            branch: 'الدمام',
            basicSalary: 6000,
            housingAllowance: 1500,
            transportAllowance: 400,
            otherAllowances: 0,
            totalSalary: 7900,
            hireDate: new Date('2024-03-15'),
        }
    ];

    /*
    for (const emp of employeesData) {
        // Check if employee exists by nationalId to avoid duplicates
        const existingEmp = await prisma.employee.findFirst({
            where: { nationalId: emp.nationalId }
        });

        if (!existingEmp) {
            await prisma.employee.create({
                data: emp
            });
            console.log(`Created employee: ${emp.fullName}`);
        } else {
            console.log(`Employee already exists: ${emp.fullName}`);
        }
    }
    */

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
