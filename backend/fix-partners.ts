import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for Delivery Partners without profiles...');

    // Find all users with DELIVERY role
    const deliveryUsers = await prisma.user.findMany({
        where: {
            roles: {
                has: 'DELIVERY'
            }
        },
        include: {
            deliveryPartner: true
        }
    });

    console.log(`Found ${deliveryUsers.length} users with DELIVERY role.`);

    for (const user of deliveryUsers) {
        if (!user.deliveryPartner) {
            console.log(`Fixing user ${user.name} (${user.id})...`);
            await prisma.deliveryPartner.create({
                data: {
                    userId: user.id,
                    vehicleType: 'bike',
                    city: 'Unknown',
                    isVerified: false,
                    isOnline: false
                }
            });
            console.log(`Created profile for ${user.name}`);
        } else {
            console.log(`User ${user.name} already has a profile.`);
        }
    }

    console.log('Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
