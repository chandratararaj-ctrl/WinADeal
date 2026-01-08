
import prisma from './src/config/database';

async function checkDeliveries() {
    console.log("Checking Delivery Assignments...");

    // 1. Get all Delivery Partners
    const partners = await prisma.deliveryPartner.findMany({
        include: { user: true }
    });
    console.log(`Found ${partners.length} partners.`);
    partners.forEach(p => {
        console.log(`- Partner: ${p.user.name} (User ID: ${p.userId}, Partner ID: ${p.id})`);
    });

    // 2. Get all Orders that are ASSIGNED
    const orders = await prisma.order.findMany({
        where: { status: 'ASSIGNED' },
        include: { delivery: true }
    });

    console.log(`Found ${orders.length} orders with status 'ASSIGNED'.`);
    orders.forEach(o => {
        console.log(`- Order ${o.orderNumber} (ID: ${o.id})`);
        console.log(`  > Delivery Record:`, o.delivery);
    });

    // 3. Get all Delivery records
    const deliveries = await prisma.delivery.findMany({
        include: { order: true }
    });
    console.log(`Found ${deliveries.length} delivery records total.`);
    deliveries.forEach(d => {
        console.log(`- Delivery ID: ${d.id}`);
        console.log(`  > Linked Order: ${d.order?.orderNumber} (${d.order?.status})`);
        console.log(`  > Partner ID: ${d.deliveryPartnerId}`);
    });
}

checkDeliveries()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
