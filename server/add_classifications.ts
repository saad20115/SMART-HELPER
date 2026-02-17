
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// List of classifications to add to all companies
const classifications = [
    "دائم", // Permanent
    "مؤقت"  // Temporary
];

async function main() {
    console.log('Connecting to database...');

    // Find all companies
    const companies = await prisma.company.findMany();

    if (companies.length === 0) {
        console.error('No companies found in the database.');
        return;
    }

    console.log(`Found ${companies.length} companies. Adding classifications to all of them.`);

    for (const company of companies) {
        console.log(`Processing company: ${company.name} (${company.id})`);

        for (const classificationName of classifications) {
            try {
                // Check if classification exists for this company
                const existingClassification = await prisma.classification.findUnique({
                    where: {
                        companyId_name: {
                            companyId: company.id,
                            name: classificationName,
                        },
                    },
                });

                if (existingClassification) {
                    // console.log(`  Classification "${classificationName}" already exists.`);
                } else {
                    await prisma.classification.create({
                        data: {
                            companyId: company.id,
                            name: classificationName,
                        },
                    });
                    console.log(`  Added classification: "${classificationName}" to ${company.name}`);
                }
            } catch (error) {
                console.error(`  Error adding classification "${classificationName}" to ${company.name}:`, error);
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
