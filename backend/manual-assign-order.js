const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function manuallyAssignOrder() {
    try {
        // Find the order ORD-1767376266012
        const order = await prisma.order.findFirst({
            where: {
                orderNumber: 'ORD-1767376266012'
            },
            include: {
                shop: true,
                deliveryAddress: true
            }
        });

        if (!order) {
            console.log('❌ Order not found');
            return;
        }

        console.log(`✅ Found order: ${order.orderNumber}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Order ID: ${order.id}`);

        // Check if delivery already exists
        const existingDelivery = await prisma.delivery.findUnique({
            where: { orderId: order.id }
        });

        if (existingDelivery) {
            console.log(`\n⚠️  Delivery already exists!`);
            console.log(`   Delivery ID: ${existingDelivery.id}`);
            console.log(`   Partner ID: ${existingDelivery.deliveryPartnerId}`);
            return;
        }

        // Find eligible delivery partners
        const partners = await prisma.deliveryPartner.findMany({
            where: {
                isOnline: true,
                isVerified: true,
                city: order.shop.address?.includes('Mumbai') ? 'Mumbai' : 'Mumbai',
                currentLatitude: { not: null },
                currentLongitude: { not: null }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        console.log(`\n📋 Found ${partners.length} eligible partners:`);
        partners.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.user.name} (${p.id})`);
            console.log(`      Location: ${p.currentLatitude}, ${p.currentLongitude}`);
            console.log(`      Online: ${p.isOnline}, Verified: ${p.isVerified}`);
        });

        if (partners.length === 0) {
            console.log('\n❌ No eligible partners found!');
            return;
        }

        // Manually assign to first partner
        const partner = partners[0];
        console.log(`\n🚀 Manually assigning to: ${partner.user.name}`);

        // Calculate earnings
        const platformCommission = (order.deliveryFee * partner.commissionRate) / 100;
        const partnerEarnings = order.deliveryFee - platformCommission;

        const delivery = await prisma.delivery.create({
            data: {
                orderId: order.id,
                deliveryPartnerId: partner.id,
                deliveryFee: order.deliveryFee,
                commissionAmount: platformCommission,
                partnerEarnings: partnerEarnings
            }
        });

        console.log(`✅ Delivery created!`);
        console.log(`   Delivery ID: ${delivery.id}`);
        console.log(`   Delivery Fee: ₹${delivery.deliveryFee}`);
        console.log(`   Partner Earnings: ₹${delivery.partnerEarnings}`);

        // Update order status
        await prisma.order.update({
            where: { id: order.id },
            data: { status: 'ASSIGNED' }
        });

        console.log(`✅ Order status updated to ASSIGNED`);

        // Create a delivery request record for tracking
        const request = await prisma.deliveryRequest.create({
            data: {
                orderId: order.id,
                deliveryPartnerId: partner.id,
                status: 'ACCEPTED',
                expiresAt: new Date(Date.now() + 15000),
                isExclusive: true,
                attemptNumber: 1,
                respondedAt: new Date()
            }
        });

        console.log(`✅ Delivery request created: ${request.id}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

manuallyAssignOrder();
