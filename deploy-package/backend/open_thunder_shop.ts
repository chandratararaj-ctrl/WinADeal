import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function openThunderShop() {
    try {
        const result = await prisma.shop.updateMany({
            where: {
                name: 'Thunder'
            },
            data: {
                isOpen: true
            }
        });

        console.log(`✅ Updated ${result.count} shop(s)`);
        console.log('Thunder shop is now OPEN for orders!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

openThunderShop();
