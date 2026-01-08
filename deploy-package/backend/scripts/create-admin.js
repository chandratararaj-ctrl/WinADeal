const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        console.log('🔍 Checking for existing admin user...\n');

        // Check if admin already exists
        const existingAdmin = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: '+919876543210' },
                    { email: 'admin@winadeal.com' }
                ]
            }
        });

        if (existingAdmin) {
            console.log('✅ Admin user already exists!\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📋 Login Credentials:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 Email:    admin@winadeal.com');
            console.log('📱 Phone:    +919876543210');
            console.log('🔑 Password: admin123');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('\n🌐 Login at: http://localhost:5175\n');
            return;
        }

        console.log('🔐 Hashing password...');
        const passwordHash = await bcrypt.hash('admin123', 10);

        console.log('👤 Creating admin user...');
        const admin = await prisma.user.create({
            data: {
                role: 'ADMIN',
                name: 'Admin User',
                phone: '+919876543210',
                email: 'admin@winadeal.com',
                passwordHash: passwordHash,
                isVerified: true,
                isActive: true,
            },
        });

        console.log('\n✅ Admin user created successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:    admin@winadeal.com');
        console.log('📱 Phone:    +919876543210');
        console.log('🔑 Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🌐 Login at: http://localhost:5175');
        console.log('\n📝 User ID:', admin.id);
        console.log('');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === 'P2002') {
            console.log('\n💡 Tip: User with this phone/email already exists.');
            console.log('Try logging in with: +919876543210 / admin123\n');
        }
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
