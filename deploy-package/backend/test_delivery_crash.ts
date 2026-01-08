
import prisma from './src/config/database';
import { OrderStatus } from '@prisma/client';

async function testGetMyDeliveries() {
    console.log("Testing getMyDeliveries logic...");

    const userId = "93f83e3d-d244-4224-a685-d93636235881"; // The known user ID

    // 1. Get Partner
    const partner = await prisma.deliveryPartner.findUnique({
        where: { userId },
    });
    console.log("Partner:", partner ? partner.id : "Not Found");

    if (!partner) return;

    // 2. Execute the exact query causing 500
    try {
        console.log("Executing findMany...");
        const allDeliveries = await prisma.delivery.findMany({
            where: {
                deliveryPartnerId: partner.id,
            },
            include: {
                order: {
                    include: {
                        shop: {
                            select: { name: true, address: true, phone: true, latitude: true, longitude: true }
                        },
                        customer: {
                            select: { name: true, phone: true }
                        },
                        deliveryAddress: true,
                        orderItems: {
                            include: { product: { select: { name: true } } }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log("Success! Found:", allDeliveries.length);
        console.log("First item order status:", allDeliveries[0]?.order?.status);
    } catch (err) {
        console.error("CRASHED:", err);
    }
}

testGetMyDeliveries()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
