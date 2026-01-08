
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking VENDOR Users ---');
    const vendors = await prisma.user.findMany({
        where: { role: 'VENDOR' },
        include: { shop: true }
    });

    if (vendors.length === 0) {
        console.log('No users with VENDOR role found.');
    } else {
        vendors.forEach(v => {
            console.log(`User: ${v.name} (${v.email}) - ID: ${v.id}`);
            console.log(`  Created At: ${v.createdAt}`);
            console.log(`  Shop: ${v.shop ? `${v.shop.name} (Verified: ${v.shop.isVerified})` : 'NONE'}`);
        });
    }

    console.log('\n--- Checking All Shops ---');
    const shops = await prisma.shop.findMany({
        include: { user: true }
    });

    if (shops.length === 0) {
        console.log('No shops found.');
    } else {
        shops.forEach(s => {
            console.log(`Shop: ${s.name} - ID: ${s.id}`);
            console.log(`  Owner: ${s.user.email}`);
            console.log(`  Verified: ${s.isVerified}`);
            console.log(`  Created At: ${s.createdAt}`);
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
