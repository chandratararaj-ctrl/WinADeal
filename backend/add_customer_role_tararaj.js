// Add CUSTOMER role to Tararaj
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCustomerRoleToTararaj() {
    try {
        console.log('📝 Adding CUSTOMER role to Tararaj...');

        // Add CUSTOMER to Tararaj's roles array
        await prisma.$executeRawUnsafe(
            `UPDATE "User" SET "roles" = array_append("roles", 'CUSTOMER'::"UserRole") WHERE id = 'ba1e3dbe-9665-4b67-948c-9b09e3b2027d' AND NOT ('CUSTOMER' = ANY("roles"))`
        );

        console.log('✅ CUSTOMER role added to Tararaj');

        // Verify
        const user = await prisma.$queryRawUnsafe(
            `SELECT name, roles FROM "User" WHERE id = 'ba1e3dbe-9665-4b67-948c-9b09e3b2027d'`
        );

        console.log('\n📊 Tararaj now has roles:', JSON.stringify(user[0].roles));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

addCustomerRoleToTararaj();
