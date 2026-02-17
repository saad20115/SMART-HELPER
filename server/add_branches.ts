
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

    // Find all companies
    const companies = await prisma.company.findMany();

    if (companies.length === 0) {
        console.error('No companies found in the database.');
        return;
    }

    console.log(`Found ${companies.length} companies. Adding branches to all of them.`);

    for (const company of companies) {
        console.log(`Processing company: ${company.name} (${company.id})`);

        for (const branchName of branches) {
            try {
                // Check if branch exists for this company
                const existingBranch = await prisma.branch.findUnique({
                    where: {
                        companyId_name: {
                            companyId: company.id,
                            name: branchName,
                        },
                    },
                });

                if (existingBranch) {
                    // console.log(`  Branch "${branchName}" already exists.`);
                } else {
                    await prisma.branch.create({
                        data: {
                            companyId: company.id,
                            name: branchName,
                        },
                    });
                    console.log(`  Added branch: "${branchName}" to ${company.name}`);
                }
            } catch (error) {
                console.error(`  Error adding branch "${branchName}" to ${company.name}:`, error);
            }
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
