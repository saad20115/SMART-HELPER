
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const classifications = await prisma.classification.findMany({
        include: {
            company: true
        }
    });

    console.log('List of Classifications:');
    if (classifications.length === 0) {
        console.log('No classifications found.');
    } else {
        classifications.forEach((c) => {
            console.log(`- Name: ${c.name}, Company: ${c.company.name} (${c.companyId})`);
        });
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
