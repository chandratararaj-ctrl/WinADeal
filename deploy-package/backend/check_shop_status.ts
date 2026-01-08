import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkShopStatus() {
    try {
        const shops = await prisma.shop.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        phone: true,
                    }
                },
                products: {
                    select: {
                        name: true,
                        isAvailable: true,
                    }
                }
            }
        });

        console.log('\n=== SHOP STATUS CHECK ===\n');

        for (const shop of shops) {
            console.log(`Shop: ${shop.name}`);
            console.log(`  Owner: ${shop.user.name} (${shop.user.phone})`);
            console.log(`  ✓ isVerified: ${shop.isVerified}`);
            console.log(`  ✓ isOpen: ${shop.isOpen}`);
            console.log(`  Products: ${shop.products.length}`);

            if (shop.products.length > 0) {
                shop.products.forEach(p => {
                    console.log(`    - ${p.name} (Available: ${p.isAvailable})`);
                });
            }

            console.log(`  Status for Customer Portal:`);
            if (!shop.isVerified) {
                console.log(`    ❌ HIDDEN - Shop not verified`);
            } else if (!shop.isOpen) {
                console.log(`    ❌ HIDDEN - Shop not open`);
            } else if (shop.products.length === 0) {
                console.log(`    ⚠️  VISIBLE but no products`);
            } else {
                const availableProducts = shop.products.filter(p => p.isAvailable);
                console.log(`    ✅ VISIBLE with ${availableProducts.length} available products`);
            }
            console.log('');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkShopStatus();
