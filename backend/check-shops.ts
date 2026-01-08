import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Shop Coordinates...');

    const shops = await prisma.shop.findMany({
        select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true
        }
    });

    console.table(shops);

    console.log('Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
