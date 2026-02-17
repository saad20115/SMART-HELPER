const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } }
});

const companies = [
    '05165325-72b0-43b9-bb59-a60128d6b194',
    'df3888fa-3d09-406f-8f99-d41c2e330234',
    'bc1ac8c4-caf9-4790-a561-3fc77eabde58',
    'a28eede2-030d-4fd5-8a8f-6c520977fede',
];

const branches = [
    'اداره المشاريع', 'الادارة العليا والشؤون المالية والادارية', 'المجلس التنسيقي',
    'المختبر البيئي', 'قسم الاشراف', 'قسم الامن والسلامة', 'قسم التصاميم',
    'قسم الدراسات الجيوتقنية', 'قسم الدراسات الهيدرولجية', 'قسم المساحه',
    'مختبر الطائف', 'مختبر جدة', 'مختبر مكة', 'مساحة مشاريع الحج',
    'مشروع العقد الموحد', 'مشروع العقد الموحد - المدينة',
];

async function main() {
    // Clear existing branches
    const del = await prisma.branch.deleteMany({});
    console.log(`Cleared: ${del.count} branches`);

    const branchData = [];
    for (const companyId of companies) {
        for (const name of branches) {
            branchData.push({ name, companyId });
        }
    }
    const result = await prisma.branch.createMany({ data: branchData });
    console.log(`Branches added: ${result.count}`);

    // Verify totals
    const totalJobs = await prisma.job.count();
    const totalBranches = await prisma.branch.count();
    console.log(`Total jobs: ${totalJobs}, Total branches: ${totalBranches}`);
    console.log('DONE!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
