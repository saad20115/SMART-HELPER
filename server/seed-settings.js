const { PrismaClient } = require('@prisma/client');

// Use DIRECT_URL to bypass pgbouncer
const prisma = new PrismaClient({
    datasources: {
        db: { url: process.env.DIRECT_URL }
    }
});

const companies = [
    '05165325-72b0-43b9-bb59-a60128d6b194',
    'df3888fa-3d09-406f-8f99-d41c2e330234',
    'bc1ac8c4-caf9-4790-a561-3fc77eabde58',
    'a28eede2-030d-4fd5-8a8f-6c520977fede',
];

const jobs = [
    'أخصائي إداري', 'أخصائي بيئي', 'أخصائي تحول رقمي', 'أخصائي تسويق', 'أخصائي تنظيم إداري',
    'أخصائي علاقات عامة', 'أخصائي عمليات موارد بشرية', 'أخصائي مبيعات', 'جيولوجي', 'دهّان',
    'رسام خرائط', 'سائق شاحنة ثقيلة', 'سكرتير', 'عامل إنشاءات', 'عامل بناء',
    'عامل تحميل وتنزيل', 'عامل تنظيف مكاتب ومنشآت', 'عامل حفر', 'عامل سفلتة', 'عامل صيانة الطرق',
    'عامل مخزن', 'عامل مهن فريدة', 'فني تصميم داخلي', 'فني جيولوجي', 'فني صيانة طرق',
    'فني مواد إنشائية', 'فني نظم حاسب آلي', 'فني هندسة كهربائية', 'فيزيائي', 'قهوجي',
    'كاتب علاقات حكومية', 'كيميائي', 'مبرمج تطبيقات', 'محاسب', 'محصل',
    'محلل نظم المعلومات', 'مدخل بيانات', 'مدير إدارة مشاريع', 'مدير مبيعات', 'مراقب إحصائي',
    'مراقب الجودة', 'مسّاح أراضي', 'مساح كميات', 'مساعد إداري', 'مصمم جرافيك',
    'مندوب مشتريات', 'مهندس تعدين', 'مهندس سلامة وصحة مهنية', 'مهندس كهربائي', 'مهندس كيميائي',
    'مهندس مدني', 'مهندس معماري', 'مهندس ميكانيكي', 'موصل كابلات كهربائية', 'موظف استقبال',
];

const branches = [
    'اداره المشاريع', 'الادارة العليا والشؤون المالية والادارية', 'المجلس التنسيقي',
    'المختبر البيئي', 'قسم الاشراف', 'قسم الامن والسلامة', 'قسم التصاميم',
    'قسم الدراسات الجيوتقنية', 'قسم الدراسات الهيدرولجية', 'قسم المساحه',
    'مختبر الطائف', 'مختبر جدة', 'مختبر مكة', 'مساحة مشاريع الحج',
    'مشروع العقد الموحد', 'مشروع العقد الموحد - المدينة',
];

async function main() {
    console.log('Connecting via DIRECT_URL...');

    // Clear existing
    const delJobs = await prisma.job.deleteMany({});
    const delBranches = await prisma.branch.deleteMany({});
    console.log(`Cleared: ${delJobs.count} jobs, ${delBranches.count} branches`);

    // Bulk insert jobs using createMany
    const jobData = [];
    for (const companyId of companies) {
        for (const name of jobs) {
            jobData.push({ name, companyId });
        }
    }
    const jobResult = await prisma.job.createMany({ data: jobData });
    console.log(`Jobs added: ${jobResult.count}`);

    // Bulk insert branches using createMany
    const branchData = [];
    for (const companyId of companies) {
        for (const name of branches) {
            branchData.push({ name, companyId });
        }
    }
    const branchResult = await prisma.branch.createMany({ data: branchData });
    console.log(`Branches added: ${branchResult.count}`);

    // Verify
    const totalJobs = await prisma.job.count();
    const totalBranches = await prisma.branch.count();
    console.log(`Verification - Total jobs: ${totalJobs}, Total branches: ${totalBranches}`);
    console.log('DONE!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
