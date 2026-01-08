// Migration script to convert role to roles array
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateRoleToRoles() {
    try {
        console.log('✅ Connected to database');

        // Step 1: Add the new roles column as an array
        console.log('\n📝 Step 1: Adding roles column...');
        await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roles" "UserRole"[]');
        console.log('✅ Roles column added');

        // Step 2: Migrate existing data
        console.log('\n📝 Step 2: Migrating existing role data to roles array...');
        await prisma.$executeRawUnsafe('UPDATE "User" SET "roles" = ARRAY[role]::"UserRole"[] WHERE "roles" IS NULL');
        console.log('✅ Data migrated');

        // Step 3: Make roles column NOT NULL
        console.log('\n📝 Step 3: Setting roles as NOT NULL...');
        await prisma.$executeRawUnsafe('ALTER TABLE "User" ALTER COLUMN "roles" SET NOT NULL');
        console.log('✅ Roles column set to NOT NULL');

        // Step 4: Drop the old role column
        console.log('\n📝 Step 4: Dropping old role column...');
        await prisma.$executeRawUnsafe('ALTER TABLE "User" DROP COLUMN IF EXISTS "role"');
        console.log('✅ Old role column dropped');

        // Step 5: Drop the old index
        console.log('\n📝 Step 5: Dropping old index...');
        await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "User_role_idx"');
        console.log('✅ Old index dropped');

        console.log('\n🎉 Migration completed successfully!');

        // Verify the migration
        console.log('\n📊 Verifying migration...');
        const users = await prisma.$queryRawUnsafe('SELECT id, name, roles FROM "User" LIMIT 5');
        console.log('\nSample users with new roles array:');
        users.forEach(user => {
            console.log(`  - ${user.name}: ${JSON.stringify(user.roles)}`);
        });

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        console.log('\n✅ Database connection closed');
    }
}

migrateRoleToRoles();
