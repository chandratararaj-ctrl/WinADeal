const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDeliveryPartners() {
    try {
        console.log('=== Checking Delivery Partners ===\n');

        const partners = await prisma.deliveryPartner.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });

        console.log(`Found ${partners.length} delivery partners:\n`);

        partners.forEach((partner, index) => {
            console.log(`${index + 1}. ${partner.user.name}`);
            console.log(`   User ID: ${partner.user.id}`);
            console.log(`   Partner ID: ${partner.id}`);
            console.log(`   Online: ${partner.isOnline}`);
            console.log(`   Verified: ${partner.isVerified}`);
            console.log(`   City: ${partner.city}`);
            console.log(`   Location: ${partner.currentLatitude ? `${partner.currentLatitude}, ${partner.currentLongitude}` : 'Not set'}`);
            console.log(`   Last Update: ${partner.lastLocationUpdate || 'Never'}`);
            console.log('');
        });

        // Check for orders
        const orders = await prisma.order.findMany({
            where: {
                status: 'ACCEPTED'
            },
            include: {
                shop: {
                    select: {
                        name: true,
                        latitude: true,
                        longitude: true,
                        city: true
                    }
                }
            }
        });

        console.log(`\n=== Orders with ACCEPTED status: ${orders.length} ===\n`);

        orders.forEach((order, index) => {
            console.log(`${index + 1}. Order ${order.orderNumber}`);
            console.log(`   Shop: ${order.shop.name}`);
            console.log(`   Shop Location: ${order.shop.latitude}, ${order.shop.longitude}`);
            console.log(`   Shop City: ${order.shop.city}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDeliveryPartners();
