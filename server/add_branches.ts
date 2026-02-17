
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const branches = [
    "اداره المشاريع",
    "الادارة العليا والشؤون المالية والادارية",
    "المجلس التنسيقي",
    "المختبر البيئي",
    "قسم الاشراف",
    "قسم الامن والسلامة",
    "قسم التصاميم",
    "قسم الدراسات الجيوتقنية",
    "قسم الدراسات الهيدرولجية",
    "قسم المساحه",
    "مختبر الطائف",
    "مختبر جدة",
    "مختبر مكة",
    "مساحة مشاريع الحج",
    "مشروع العقد الموحد",
    "مشروع العقد الموحد - المدينة"
];

async function main() {
    console.log('Connecting to database...');

    // Find the first company
    const company = await prisma.company.findFirst();

    if (!company) {
        console.error('No company found in the database. Please create a company first.');
        return;
    }

    console.log(`Found company: ${company.name} (${company.id})`);

    for (const branchName of branches) {
        try {
            // Check if branch exists
            const existingBranch = await prisma.branch.findUnique({
                where: {
                    companyId_name: {
                        companyId: company.id,
                        name: branchName,
                    },
                },
            });

            if (existingBranch) {
                console.log(`Branch "${branchName}" already exists.`);
            } else {
                await prisma.branch.create({
                    data: {
                        companyId: company.id,
                        name: branchName,
                    },
                });
                console.log(`Added branch: "${branchName}"`);
            }
        } catch (error) {
            console.error(`Error adding branch "${branchName}":`, error);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
