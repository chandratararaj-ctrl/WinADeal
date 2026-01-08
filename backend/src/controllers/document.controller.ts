import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        return errorResponse(res, 'No file uploaded', 400);
    }

    const userId = req.user?.userId;
    const { type } = req.body;

    if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
    }

    if (!type) {
        return errorResponse(res, 'Document type is required', 400);
    }

    // Since we are using local storage, the URL is relative to the server
    // e.g., http://localhost:5000/uploads/filename
    // In production, this should be an environment variable
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // Check if document already exists
    const existingDoc = await prisma.document.findFirst({
        where: { userId, type: type as any }
    });

    let document;
    if (existingDoc) {
        document = await prisma.document.update({
            where: { id: existingDoc.id },
            data: {
                fileUrl,
                status: 'PENDING',
                rejectionReason: null
            }
        });
    } else {
        document = await prisma.document.create({
            data: {
                userId,
                type: type as any,
                fileUrl,
                status: 'PENDING'
            }
        });
    }

    successResponse(res, document, 'Document uploaded successfully');
});

export const getMyDocuments = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
    }

    const documents = await prisma.document.findMany({
        where: { userId }
    });

    successResponse(res, documents);
});
