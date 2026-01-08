// Script to change Tararaj's role to CUSTOMER
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function changeRole() {
    try {
        const updated = await prisma.user.update({
            where: { id: 'ba1e3dbe-9665-4b67-948c-9b09e3b2027d' },
            data: { role: 'CUSTOMER' }
        });

        console.log('✅ Updated user role:');
        console.log(`   Name: ${updated.name}`);
        console.log(`   Role: ${updated.role}`);
        console.log('\n⚠️  Note: This user can no longer access the vendor panel!');
        console.log('   To revert, run: UPDATE "User" SET role = \'VENDOR\' WHERE id = \'ba1e3dbe-9665-4b67-948c-9b09e3b2027d\';');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

changeRole();
