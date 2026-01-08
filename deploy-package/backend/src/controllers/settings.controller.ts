import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';

const DEFAULT_SETTINGS: Record<string, string> = {
    PLATFORM_NAME: 'WinADeal',
    CURRENCY: 'INR',
    TAX_RATE: '5',
    DELIVERY_BASE_FEE: '20',
    DELIVERY_PER_KM_FEE: '10',
    DELIVERY_PLATFORM_COMMISSION: '10',
    DELIVERY_BASE_DISTANCE: '2',
    DELIVERY_MAX_RADIUS: '10',
    SUPPORT_EMAIL: 'support@winadeal.com',
    SUPPORT_PHONE: '+91 1234567890',
    MIN_ORDER_VALUE: '100'
};

// Get All Settings
export const getDeliverySettings = asyncHandler(async (req: Request, res: Response) => {
    const keys = Object.keys(DEFAULT_SETTINGS);
    const settingsList = await prisma.appConfig.findMany({
        where: { key: { in: keys } }
    });

    const settings: any = { ...DEFAULT_SETTINGS };
    settingsList.forEach(item => {
        settings[item.key] = item.value;
    });

    const response = {
        platformName: settings.PLATFORM_NAME,
        currency: settings.CURRENCY,
        taxRate: parseFloat(settings.TAX_RATE),
        baseFee: parseFloat(settings.DELIVERY_BASE_FEE),
        perKmFee: parseFloat(settings.DELIVERY_PER_KM_FEE),
        platformCommission: parseFloat(settings.DELIVERY_PLATFORM_COMMISSION),
        baseDistance: parseFloat(settings.DELIVERY_BASE_DISTANCE),
        maxDeliveryRadius: parseFloat(settings.DELIVERY_MAX_RADIUS),
        supportEmail: settings.SUPPORT_EMAIL,
        supportPhone: settings.SUPPORT_PHONE,
        minOrderValue: parseFloat(settings.MIN_ORDER_VALUE)
    };

    successResponse(res, response, 'Platform settings retrieved successfully');
});

// Update Settings
export const updateDeliverySettings = asyncHandler(async (req: Request, res: Response) => {
    const {
        platformName, currency, taxRate,
        baseFee, perKmFee, platformCommission, baseDistance, maxDeliveryRadius,
        supportEmail, supportPhone, minOrderValue
    } = req.body;

    // Validate required fields (basic validation)
    if (baseFee === undefined) return errorResponse(res, 'Missing baseFee', 400);

    // Correctly access userId from request (middleware attaches it as userId)
    const user = (req as any).user;
    const userId = user?.userId;

    if (!userId) {
        return errorResponse(res, 'User ID not found in request', 401);
    }

    // Prepare inputs map
    const newValues: Record<string, string> = {
        PLATFORM_NAME: String(platformName || DEFAULT_SETTINGS.PLATFORM_NAME),
        CURRENCY: String(currency || DEFAULT_SETTINGS.CURRENCY),
        TAX_RATE: String(taxRate ?? DEFAULT_SETTINGS.TAX_RATE),
        DELIVERY_BASE_FEE: String(baseFee ?? DEFAULT_SETTINGS.DELIVERY_BASE_FEE),
        DELIVERY_PER_KM_FEE: String(perKmFee ?? DEFAULT_SETTINGS.DELIVERY_PER_KM_FEE),
        DELIVERY_PLATFORM_COMMISSION: String(platformCommission ?? DEFAULT_SETTINGS.DELIVERY_PLATFORM_COMMISSION),
        DELIVERY_BASE_DISTANCE: String(baseDistance ?? DEFAULT_SETTINGS.DELIVERY_BASE_DISTANCE),
        DELIVERY_MAX_RADIUS: String(maxDeliveryRadius ?? DEFAULT_SETTINGS.DELIVERY_MAX_RADIUS),
        SUPPORT_EMAIL: String(supportEmail || DEFAULT_SETTINGS.SUPPORT_EMAIL),
        SUPPORT_PHONE: String(supportPhone || DEFAULT_SETTINGS.SUPPORT_PHONE),
        MIN_ORDER_VALUE: String(minOrderValue ?? DEFAULT_SETTINGS.MIN_ORDER_VALUE)
    };

    const keys = Object.keys(newValues);

    // Fetch current values to check for changes
    const currentSettingsList = await prisma.appConfig.findMany({
        where: { key: { in: keys } }
    });

    const currentSettingsMap: Record<string, string> = {};
    currentSettingsList.forEach(item => {
        currentSettingsMap[item.key] = item.value;
    });

    const writes = [];

    for (const key of keys) {
        const newValue = newValues[key];
        // If not pending in DB, assuming default was treated as initial state. 
        // Realistically, if it's missing in DB, we insert it.
        // We only log history if it previously existed and is changing, OR if we want to log the initial set.
        // Let's log if it's different from what we *think* it is (currentSettingsMap or Default if missing? No, DB is truth).

        const oldValue = currentSettingsMap[key]; // might be undefined if first time

        // Upsert Config
        writes.push(prisma.appConfig.upsert({
            where: { key },
            update: { value: newValue },
            create: { key, value: newValue }
        }));

        // Log History if changed
        // If oldValue is undefined, it means we are setting it for the first time in DB.
        // If oldValue is defined and different, log it.
        if (oldValue !== undefined && oldValue !== newValue) {
            writes.push(prisma.settingHistory.create({
                data: {
                    key,
                    oldValue,
                    newValue,
                    changedBy: userId
                }
            }));
        } else if (oldValue === undefined && newValue !== DEFAULT_SETTINGS[key]) {
            // Optional: Log initial change from "hardcoded default" if meaningful? 
            // Simpler to just log updates to existing DB records.
            // But let's log everything that is an "update".
            writes.push(prisma.settingHistory.create({
                data: {
                    key,
                    oldValue: 'DEFAULT',
                    newValue,
                    changedBy: userId
                }
            }));
        }
    }

    await prisma.$transaction(writes);

    successResponse(res, newValues, 'Platform settings updated successfully');
});

// Get Setting History
export const getSettingHistory = asyncHandler(async (req: Request, res: Response) => {
    const history = await prisma.settingHistory.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { name: true, email: true }
            }
        },
        take: 100
    });

    successResponse(res, history, 'Settings history retrieved successfully');
});
