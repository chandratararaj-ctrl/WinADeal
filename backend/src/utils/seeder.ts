import { PrismaClient, UserRole, CategoryType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const seedDatabase = async () => {
    try {
        const userCount = await prisma.user.count();
        if (userCount > 0) {
            console.log('ℹ️  Database already has users, skipping seed.');
            return;
        }

        console.log('🌱 Starting database seeding...');

        // Create Admin User
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await prisma.user.create({
            data: {
                roles: [UserRole.ADMIN],
                name: 'Admin User',
                email: 'admin@winadeal.com',
                phone: '+919999999999',
                passwordHash: adminPassword,
                isVerified: true,
                isActive: true,
            },
        });
        console.log('✅ Admin user created:', admin.email);

        // Create Food Categories
        const foodCategories = [
            { name: 'Pizza', type: CategoryType.FOOD, icon: '🍕', displayOrder: 1 },
            { name: 'Burger', type: CategoryType.FOOD, icon: '🍔', displayOrder: 2 },
            { name: 'Biryani', type: CategoryType.FOOD, icon: '🍛', displayOrder: 3 },
            { name: 'Chinese', type: CategoryType.FOOD, icon: '🥡', displayOrder: 4 },
            { name: 'South Indian', type: CategoryType.FOOD, icon: '🥘', displayOrder: 5 },
            { name: 'Desserts', type: CategoryType.FOOD, icon: '🍰', displayOrder: 6 },
            { name: 'Beverages', type: CategoryType.FOOD, icon: '🥤', displayOrder: 7 },
        ];

        for (const category of foodCategories) {
            await prisma.category.create({ data: category });
        }
        console.log('✅ Food categories created');

        // Create Grocery Categories
        const groceryCategories = [
            { name: 'Vegetables', type: CategoryType.GROCERY, icon: '🥬', displayOrder: 1 },
            { name: 'Fruits', type: CategoryType.GROCERY, icon: '🍎', displayOrder: 2 },
            { name: 'Dairy', type: CategoryType.GROCERY, icon: '🥛', displayOrder: 3 },
            { name: 'Bakery', type: CategoryType.GROCERY, icon: '🍞', displayOrder: 4 },
            { name: 'Snacks', type: CategoryType.GROCERY, icon: '🍿', displayOrder: 5 },
            { name: 'Beverages', type: CategoryType.GROCERY, icon: '🧃', displayOrder: 6 },
            { name: 'Personal Care', type: CategoryType.GROCERY, icon: '🧴', displayOrder: 7 },
        ];

        for (const category of groceryCategories) {
            await prisma.category.create({ data: category });
        }
        console.log('✅ Grocery categories created');

        // Create Sample Vendor User
        const vendorPassword = await bcrypt.hash('vendor123', 10);
        const vendor = await prisma.user.create({
            data: {
                roles: [UserRole.VENDOR],
                name: 'Test Restaurant',
                email: 'vendor@winadeal.com',
                phone: '+919999999998',
                passwordHash: vendorPassword,
                isVerified: true,
                isActive: true,
            },
        });
        console.log('✅ Vendor user created:', vendor.email);

        // Create Sample Shop for Vendor
        const pizzaCategory = await prisma.category.findFirst({
            where: { name: 'Pizza' },
        });

        if (pizzaCategory) {
            const shop = await prisma.shop.create({
                data: {
                    userId: vendor.id,
                    name: 'Pizza Paradise',
                    description: 'Best pizzas in town with authentic Italian flavors',
                    categoryId: pizzaCategory.id,
                    address: '123 Main Street, Mumbai, Maharashtra 400001',
                    latitude: 19.0760,
                    longitude: 72.8777,
                    deliveryRadiusKm: 5,
                    avgPrepTimeMins: 30,
                    isOpen: true,
                    isVerified: true,
                    commissionRate: 20.0,
                    rating: 4.5,
                    totalOrders: 150,
                    gstin: 'GST123456789',
                    fssaiNumber: 'FSSAI123456',
                },
            });
            console.log('✅ Sample shop created:', shop.name);

            // Create Sample Products
            const products = [
                {
                    name: 'Margherita Pizza',
                    description: 'Classic pizza with tomato sauce, mozzarella, and basil',
                    price: 299,
                    isVeg: true,
                    isAvailable: true,
                    images: ['https://via.placeholder.com/400x300?text=Margherita+Pizza'],
                },
                {
                    name: 'Pepperoni Pizza',
                    description: 'Loaded with pepperoni and extra cheese',
                    price: 399,
                    isVeg: false,
                    isAvailable: true,
                    images: ['https://via.placeholder.com/400x300?text=Pepperoni+Pizza'],
                },
                {
                    name: 'Veggie Supreme',
                    description: 'Loaded with fresh vegetables and cheese',
                    price: 349,
                    isVeg: true,
                    isAvailable: true,
                    images: ['https://via.placeholder.com/400x300?text=Veggie+Supreme'],
                },
            ];

            for (const product of products) {
                await prisma.product.create({
                    data: {
                        ...product,
                        shopId: shop.id,
                        categoryId: pizzaCategory.id,
                    },
                });
            }
            console.log('✅ Sample products created');
        }

        // Create Sample Customer User
        const customerPassword = await bcrypt.hash('customer123', 10);
        const customer = await prisma.user.create({
            data: {
                roles: [UserRole.CUSTOMER],
                name: 'John Doe',
                email: 'customer@winadeal.com',
                phone: '+919999999997',
                passwordHash: customerPassword,
                isVerified: true,
                isActive: true,
            },
        });
        console.log('✅ Customer user created:', customer.email);

        // Create Sample Address for Customer
        await prisma.address.create({
            data: {
                userId: customer.id,
                label: 'home',
                addressLine1: '456 Park Avenue',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400002',
                latitude: 19.0760,
                longitude: 72.8777,
                isDefault: true,
            },
        });
        console.log('✅ Sample address created');

        // Create Sample Delivery Partner
        const deliveryPassword = await bcrypt.hash('delivery123', 10);
        const deliveryPartnerUser = await prisma.user.create({
            data: {
                roles: [UserRole.DELIVERY],
                name: 'Delivery Partner',
                email: 'delivery@winadeal.com',
                phone: '+919999999996',
                passwordHash: deliveryPassword,
                isVerified: true,
                isActive: true,
            },
        });

        await prisma.deliveryPartner.create({
            data: {
                userId: deliveryPartnerUser.id,
                vehicleType: 'bike',
                vehicleNumber: 'MH01AB1234',
                city: 'Mumbai',
                zone: 'South Mumbai',
                isOnline: true,
                isVerified: true,
                rating: 4.8,
                totalDeliveries: 200,
            },
        });
        console.log('✅ Delivery partner created:', deliveryPartnerUser.email);

        // Create App Config
        const configs = [
            { key: 'MIN_ORDER_VALUE', value: '50' },
            { key: 'DEFAULT_DELIVERY_RADIUS_KM', value: '5' },
            { key: 'DEFAULT_COMMISSION_RATE', value: '20' },
            { key: 'DELIVERY_FEE_PER_KM', value: '10' },
            { key: 'BASE_DELIVERY_FEE', value: '30' },
        ];

        for (const config of configs) {
            await prisma.appConfig.create({
                data: config,
            });
        }
        console.log('✅ App configuration created');

        console.log('🎉 Auto-seeding completed!');
    } catch (error) {
        console.error('❌ Auto-seeding failed:', error);
    }
};
