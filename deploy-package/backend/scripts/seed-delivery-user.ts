
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const phone = '+919876543210';
    const password = 'driver123';
    const hashedPassword = await hash(password, 10);

    const existingUser = await prisma.user.findUnique({
        where: { phone },
    });

    if (existingUser) {
        console.log('User already exists. Updating to DELIVERY role...');
        // Force update to DELIVERY role and set password
        await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                role: 'DELIVERY',
                passwordHash: hashedPassword,
                isActive: true,
                isVerified: true
            },
        });
        console.log('User updated successfully.');
    } else {
        console.log('Creating new Delivery User...');
        await prisma.user.create({
            data: {
                name: 'Demo Driver',
                phone,
                email: 'driver@winadeal.com',
                passwordHash: hashedPassword,
                role: 'DELIVERY',
                isVerified: true,
                isActive: true,
            },
        });
        console.log('Delivery User created successfully.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
