
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const phone = '+919876543210';

    const user = await prisma.user.findUnique({
        where: { phone },
    });

    if (!user) {
        console.error('User not found! Run the previous seed script first.');
        return;
    }

    const existingPartner = await prisma.deliveryPartner.findUnique({
        where: { userId: user.id },
    });

    if (existingPartner) {
        console.log('Delivery Partner profile already exists.');
    } else {
        console.log('Creating Delivery Partner profile...');
        // Create default profile
        await prisma.deliveryPartner.create({
            data: {
                userId: user.id,
                vehicleType: 'bike',
                vehicleNumber: 'KA-01-AB-1234',
                city: 'Mumbai',
                zone: 'Borivali',
                isVerified: true,
                isOnline: false,
            },
        });
        console.log('Delivery Partner profile created successfully.');
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
