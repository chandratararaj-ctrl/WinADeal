
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking ALL Users ---');
    const users = await prisma.user.findMany();

    users.forEach(v => {
        console.log(`User: ${v.name} (${v.email})`);
        console.log(`  Role: ${v.role}`);
        console.log(`  ID: ${v.id}`);
        console.log(`  Created At: ${v.createdAt}`);
        console.log('-----------------------------------');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
