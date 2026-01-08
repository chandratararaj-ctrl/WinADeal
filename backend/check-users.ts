import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            take: 5,
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                roles: true,
                isActive: true,
                passwordHash: true
            }
        });

        console.log('Users in database:');
        console.log(JSON.stringify(users, null, 2));

        if (users.length > 0) {
            console.log('\nFirst user roles type:', typeof users[0].roles);
            console.log('First user roles:', users[0].roles);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
