
import prisma from './src/config/database';

async function reproduceCrash() {
    try {
        const userId = "93f83e3d-d244-4224-a685-d93636235881";

        console.log("Fetching partner...");
        const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
        if (!partner) throw new Error("Partner not found");

        console.log("Fetching deliveries...");
        const allDeliveries = await prisma.delivery.findMany({
            where: { deliveryPartnerId: partner.id },
            include: {
                order: {
                    include: {
                        shop: { select: { name: true, address: true, phone: true } },
                        customer: { select: { name: true, phone: true } },
                        deliveryAddress: true,
                        orderItems: { include: { product: { select: { name: true } } } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`Fetched ${allDeliveries.length} deliveries.`);

        // Simulate filtering logic
        const status = 'active';
        let deliveries = allDeliveries;
        if (status === 'active') {
            const activeStatuses = ['ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'];
            // THIS is the line suspected to crash
            deliveries = allDeliveries.filter(d => {
                // console.log("Checking order:", d.order?.status);
                return d.order && activeStatuses.includes(d.order.status as string);
            });
        }
        console.log("Filtered length:", deliveries.length);

    } catch (error) {
        console.error("CRASH REPRODUCED:", error);
    }
}

reproduceCrash()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
