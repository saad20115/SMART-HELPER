const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.findMany();
    console.log(`Found ${companies.length} companies`);

    const classificationNames = ['دائم', 'مؤقت'];

    for (const company of companies) {
        for (const name of classificationNames) {
            try {
                await prisma.classification.upsert({
                    where: {
                        companyId_name: {
                            companyId: company.id,
                            name: name,
                        },
                    },
                    update: {},
                    create: {
                        name: name,
                        companyId: company.id,
                    },
                });
                console.log(`✅ Added '${name}' for company '${company.name}'`);
            } catch (err) {
                console.log(`⚠️ Skipped '${name}' for company '${company.name}': ${err.message}`);
            }
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
