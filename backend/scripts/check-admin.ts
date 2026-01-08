import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFixAdmin() {
    try {
        // Find admin user
        const adminUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: '+919999999999' },
                    { email: 'admin@winadeal.com' }
                ]
            }
        });

        if (!adminUser) {
            console.log('❌ Admin user not found!');
            console.log('Creating admin user...');

            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);

            const newAdmin = await prisma.user.create({
                data: {
                    name: 'Admin',
                    phone: '+919999999999',
                    email: 'admin@winadeal.com',
                    passwordHash: hashedPassword,
                    roles: ['ADMIN'],
                    isVerified: true,
                    isActive: true
                }
            });

            console.log('✅ Admin user created:', {
                id: newAdmin.id,
                name: newAdmin.name,
                phone: newAdmin.phone,
                email: newAdmin.email,
                roles: newAdmin.roles
            });
        } else {
            console.log('📋 Current admin user:', {
                id: adminUser.id,
                name: adminUser.name,
                phone: adminUser.phone,
                email: adminUser.email,
                roles: adminUser.roles,
                isActive: adminUser.isActive,
                isVerified: adminUser.isVerified
            });

            // Check if roles need fixing
            if (!Array.isArray(adminUser.roles) || !adminUser.roles.includes('ADMIN')) {
                console.log('⚠️  Admin roles need fixing!');
                console.log('Current roles:', adminUser.roles);

                const updated = await prisma.user.update({
                    where: { id: adminUser.id },
                    data: { roles: ['ADMIN'] }
                });

                console.log('✅ Admin roles fixed:', updated.roles);
            } else {
                console.log('✅ Admin roles are correct!');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndFixAdmin();
