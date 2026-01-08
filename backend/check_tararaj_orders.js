// Quick diagnostic script to check Tararaj's orders
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTararajOrders() {
    try {
        // Find all users named Tararaj
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: 'Tararaj', mode: 'insensitive' } },
                    { name: { contains: 'tararaj', mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                role: true
            }
        });

        console.log('\n=== Users matching "Tararaj" ===');
        console.log(JSON.stringify(users, null, 2));

        if (users.length === 0) {
            console.log('\n❌ No users found with name containing "Tararaj"');
            return;
        }

        // Check orders for each Tararaj user
        for (const user of users) {
            console.log(`\n=== Orders for ${user.name} (ID: ${user.id}) ===`);

            const orders = await prisma.order.findMany({
                where: { customerId: user.id },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    total: true,
                    createdAt: true,
                    shop: {
                        select: { name: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            if (orders.length === 0) {
                console.log('  No orders found for this user');
            } else {
                console.log(`  Found ${orders.length} orders:`);
                orders.forEach(order => {
                    console.log(`  - ${order.orderNumber} | Status: ${order.status} | Shop: ${order.shop.name} | ₹${order.total}`);
                });
            }
        }

        // Also check for ASSIGNED orders regardless of customer
        console.log('\n=== All ASSIGNED orders in the system ===');
        const assignedOrders = await prisma.order.findMany({
            where: { status: 'ASSIGNED' },
            select: {
                id: true,
                orderNumber: true,
                customerId: true,
                customer: {
                    select: { name: true, phone: true }
                },
                shop: {
                    select: { name: true }
                },
                total: true,
                createdAt: true
            }
        });

        if (assignedOrders.length === 0) {
            console.log('  No ASSIGNED orders found');
        } else {
            assignedOrders.forEach(order => {
                console.log(`  - ${order.orderNumber} | Customer: ${order.customer.name} (${order.customer.phone}) | Shop: ${order.shop.name}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTararajOrders();
