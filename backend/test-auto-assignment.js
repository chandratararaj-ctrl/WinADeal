const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAutoAssignment() {
    try {
        // Find an ACCEPTED order
        const order = await prisma.order.findFirst({
            where: {
                status: 'ACCEPTED'
            },
            include: {
                shop: true,
                deliveryAddress: true
            }
        });

        if (!order) {
            console.log('❌ No ACCEPTED orders found');
            console.log('\nCreating a test order...');

            // Get a shop
            const shop = await prisma.shop.findFirst();
            if (!shop) {
                console.log('❌ No shops found');
                return;
            }

            // Get a customer
            const customer = await prisma.user.findFirst({
                where: {
                    roles: {
                        has: 'CUSTOMER'
                    }
                }
            });

            if (!customer) {
                console.log('❌ No customers found');
                return;
            }

            // Get an address
            const address = await prisma.address.findFirst({
                where: {
                    userId: customer.id
                }
            });

            if (!address) {
                console.log('❌ No addresses found');
                return;
            }

            console.log(`Creating order for shop: ${shop.name}`);

            const newOrder = await prisma.order.create({
                data: {
                    orderNumber: `ORD-TEST-${Date.now()}`,
                    customerId: customer.id,
                    shopId: shop.id,
                    status: 'ACCEPTED',
                    deliveryAddressId: address.id,
                    subtotal: 100,
                    deliveryFee: 50,
                    tax: 5,
                    total: 155,
                    paymentMethod: 'CASH',
                    paymentStatus: 'PENDING'
                }
            });

            console.log(`✅ Created test order: ${newOrder.orderNumber}`);
            console.log(`   Order ID: ${newOrder.id}`);
            console.log(`   Status: ${newOrder.status}`);

            return;
        }

        console.log(`✅ Found ACCEPTED order: ${order.orderNumber}`);
        console.log(`   Order ID: ${order.id}`);
        console.log(`   Shop: ${order.shop.name}`);
        console.log(`   Shop Location: ${order.shop.latitude}, ${order.shop.longitude}`);

        // Check if delivery already exists
        const existingDelivery = await prisma.delivery.findUnique({
            where: {
                orderId: order.id
            }
        });

        if (existingDelivery) {
            console.log(`\n⚠️  Delivery already assigned to partner: ${existingDelivery.deliveryPartnerId}`);
        } else {
            console.log(`\n✅ No delivery assigned yet - auto-assignment should trigger`);
        }

        // Check delivery requests
        const requests = await prisma.deliveryRequest.findMany({
            where: {
                orderId: order.id
            },
            include: {
                deliveryPartner: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        console.log(`\n📋 Delivery Requests: ${requests.length}`);
        requests.forEach((req, i) => {
            console.log(`   ${i + 1}. ${req.deliveryPartner.user.name} - ${req.status}`);
            console.log(`      Created: ${req.createdAt}`);
            console.log(`      Expires: ${req.expiresAt}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAutoAssignment();
