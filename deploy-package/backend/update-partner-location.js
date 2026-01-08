const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDeliveryPartner() {
    try {
        // Update Badsha's delivery partner profile
        const updated = await prisma.deliveryPartner.update({
            where: {
                id: '7e9ad491-987f-43a6-b44f-cc89b7bb4ade' // Badsha's partner ID
            },
            data: {
                city: 'Mumbai', // Match shop city
                currentLatitude: 19.0760, // Mumbai coordinates (example)
                currentLongitude: 72.8777,
                lastLocationUpdate: new Date()
            }
        });

        console.log('✅ Updated Badsha delivery partner:');
        console.log(JSON.stringify(updated, null, 2));

        // Also update the other partner
        const updated2 = await prisma.deliveryPartner.update({
            where: {
                id: 'b42aaa9a-b745-4fe3-8293-e15218d155d8'
            },
            data: {
                currentLatitude: 19.0760,
                currentLongitude: 72.8777,
                lastLocationUpdate: new Date()
            }
        });

        console.log('\n✅ Updated Delivery Partner:');
        console.log(JSON.stringify(updated2, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateDeliveryPartner();
