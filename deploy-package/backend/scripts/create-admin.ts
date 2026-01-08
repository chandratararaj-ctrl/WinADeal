import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/auth';

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await prisma.user.findFirst({
            where: {
                role: 'ADMIN',
                phone: '+919876543210'
            }
        });

        if (existingAdmin) {
            console.log('✅ Admin user already exists!');
            console.log('📧 Email:', existingAdmin.email);
            console.log('📱 Phone:', existingAdmin.phone);
            console.log('🔑 Password: admin123');
            console.log('\n🌐 Login at: http://localhost:5175');
            return;
        }

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                role: 'ADMIN',
                name: 'Admin User',
                phone: '+919876543210',
                email: 'admin@winadeal.com',
                passwordHash: await hashPassword('admin123'),
                isVerified: true,
                isActive: true,
            },
        });

        console.log('✅ Admin user created successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:    admin@winadeal.com');
        console.log('📱 Phone:    +919876543210');
        console.log('🔑 Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🌐 Login at: http://localhost:5175');
        console.log('\nUser ID:', admin.id);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
