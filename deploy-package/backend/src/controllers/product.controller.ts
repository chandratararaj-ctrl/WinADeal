import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';

// Get all categories
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.query;

    const where: any = {
        isActive: true,
    };

    if (type) {
        where.type = type as string;
    }

    const categories = await prisma.category.findMany({
        where,
        orderBy: {
            displayOrder: 'asc',
        },
        include: {
            _count: {
                select: {
                    shops: true,
                    products: true,
                },
            },
        },
    });

    successResponse(res, categories);
});

// Get category by ID
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
        where: { id },
        include: {
            shops: {
                where: {
                    isVerified: true,
                    isOpen: true,
                },
                take: 10,
            },
            _count: {
                select: {
                    shops: true,
                    products: true,
                },
            },
        },
    });

    if (!category) {
        return errorResponse(res, 'Category not found', 404);
    }

    successResponse(res, category);
});

// Get all products
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const { search, categoryId, shopId, isVeg, page = 1, limit = 20, includeInactive } = req.query;

    const where: any = {};

    if (includeInactive !== 'true') {
        where.isAvailable = true;
    }

    if (search) {
        where.OR = [
            { name: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } },
        ];
    }

    if (categoryId) {
        where.categoryId = categoryId as string;
    }

    if (shopId) {
        where.shopId = shopId as string;
    }

    if (isVeg !== undefined) {
        where.isVeg = isVeg === 'true';
    }

    const products = await prisma.product.findMany({
        where,
        include: {
            shop: {
                select: {
                    id: true,
                    name: true,
                    rating: true,
                    isOpen: true,
                },
            },
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            variants: true,
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: {
            createdAt: 'desc',
        },
    });

    const total = await prisma.product.count({ where });

    successResponse(res, {
        products,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});

// Get product by ID
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            shop: {
                select: {
                    id: true,
                    name: true,
                    rating: true,
                    isOpen: true,
                    address: true,
                    avgPrepTimeMins: true,
                },
            },
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            variants: true,
        },
    });

    if (!product) {
        return errorResponse(res, 'Product not found', 404);
    }

    successResponse(res, product);
});

// Create product
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, price, discountPrice, categoryId, shopId, isVeg, image, stock } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.selectedRole;

    if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
    }

    let targetShopId = shopId;

    // If user is vendor, enforce using their shop
    if (userRole === 'VENDOR') {
        const shop = await prisma.shop.findUnique({
            where: { userId: userId },
        });

        if (!shop) {
            return errorResponse(res, 'Shop not found for this vendor', 404);
        }
        targetShopId = shop.id;
    }

    if (!targetShopId) {
        return errorResponse(res, 'Shop ID is required', 400);
    }

    // Handle images (ensure array)
    const images = image ? (Array.isArray(image) ? image : [image]) : [];

    // Create product
    const product = await prisma.product.create({
        data: {
            name,
            description,
            price: Number(price),
            discountedPrice: discountPrice ? Number(discountPrice) : null,
            categoryId,
            shopId: targetShopId,
            isVeg: isVeg === true || isVeg === 'true',
            images,
            stockQuantity: Number(stock || 0),
            isAvailable: true,
        },
    });

    successResponse(res, product, 'Product created successfully', 201);
});

// Update product
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, price, discountPrice, categoryId, isVeg, image, stock, isAvailable } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.selectedRole;

    // Find product first
    const product = await prisma.product.findUnique({
        where: { id },
        include: { shop: true },
    });

    if (!product) {
        return errorResponse(res, 'Product not found', 404);
    }

    // Check permission
    if (userRole === 'VENDOR') {
        if (product.shop.userId !== userId) {
            return errorResponse(res, 'You do not have permission to update this product', 403);
        }
    }

    // Handle images
    const images = image ? (Array.isArray(image) ? image : [image]) : undefined;

    // Update product
    const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
            name,
            description,
            price: price ? Number(price) : undefined,
            discountedPrice: discountPrice !== undefined ? Number(discountPrice) : undefined,
            categoryId,
            isVeg: isVeg !== undefined ? (isVeg === true || isVeg === 'true') : undefined,
            images,
            stockQuantity: stock !== undefined ? Number(stock) : undefined,
            isAvailable: isAvailable !== undefined ? (isAvailable === true || isAvailable === 'true') : undefined,
        },
    });

    successResponse(res, updatedProduct, 'Product updated successfully');
});

// Delete product
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.selectedRole;

    // Find product first
    const product = await prisma.product.findUnique({
        where: { id },
        include: { shop: true },
    });

    if (!product) {
        return errorResponse(res, 'Product not found', 404);
    }

    // Check permission
    if (userRole === 'VENDOR') {
        if (product.shop.userId !== userId) {
            return errorResponse(res, 'You do not have permission to delete this product', 403);
        }
    }

    // Delete product
    await prisma.product.delete({
        where: { id },
    });

    successResponse(res, null, 'Product deleted successfully');
});
