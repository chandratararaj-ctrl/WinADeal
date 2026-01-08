
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking for Order Flow Readiness ---');

    // 1. Check Vendor/Shop
    const vendorUser = await prisma.user.findFirst({
        where: { role: 'VENDOR' },
        include: { shop: true }
    });

    if (!vendorUser) {
        console.log('❌ No Vendor User found.');
    } else if (!vendorUser.shop) {
        console.log('❌ Vendor found but no Shop profile.');
    } else {
        console.log(`✅ Vendor Shop found: ${vendorUser.shop.name} (isVerified: ${vendorUser.shop.isVerified}, isOpen: ${vendorUser.shop.isOpen})`);
    }

    // 2. Check Products
    const products = await prisma.product.findMany({
        take: 5
    });

    if (products.length === 0) {
        console.log('❌ No Products found.');
    } else {
        console.log(`✅ ${products.length} Products found. Sample: ${products[0].name} - ₹${products[0].price}`);
    }

    // 3. Check Customer
    const customer = await prisma.user.findFirst({
        where: { role: 'CUSTOMER' }
    });

    if (!customer) {
        console.log('❌ No Customer User found.');
    } else {
        console.log(`✅ Customer found: ${customer.name} (${customer.phone})`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
