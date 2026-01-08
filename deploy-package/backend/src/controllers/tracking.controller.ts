import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const trackingController = {
    // Start tracking for a delivery
    async startTracking(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const { deliveryId } = req.params;

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // Get DeliveryPartner ID from User ID
            const partner = await prisma.deliveryPartner.findUnique({
                where: { userId }
            });

            if (!partner) {
                return res.status(403).json({ message: 'Delivery Partner profile not found' });
            }

            // Verify delivery belongs to this partner
            const delivery = await prisma.delivery.findFirst({
                where: {
                    id: deliveryId,
                    deliveryPartnerId: partner.id
                }
            });

            if (!delivery) {
                return res.status(404).json({ message: 'Delivery not found or not assigned to you' });
            }

            // Start tracking
            const updatedDelivery = await prisma.delivery.update({
                where: { id: deliveryId },
                data: {
                    isTracking: true,
                    trackingStartedAt: new Date()
                }
            });

            res.json(updatedDelivery);
        } catch (error) {
            console.error('Error starting tracking:', error);
            res.status(500).json({ message: 'Failed to start tracking' });
        }
    },

    // Update location
    async updateLocation(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const { deliveryId } = req.params;
            const { latitude, longitude, speed, heading, accuracy } = req.body;

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
            if (!partner) return res.status(403).json({ message: 'Partner profile not found' });

            // Verify delivery belongs to this partner
            const delivery = await prisma.delivery.findFirst({
                where: {
                    id: deliveryId,
                    deliveryPartnerId: partner.id
                }
            });

            if (!delivery) {
                return res.status(404).json({ message: 'Delivery not found' });
            }

            // Update current location
            const updatedDelivery = await prisma.delivery.update({
                where: { id: deliveryId },
                data: {
                    currentLatitude: latitude,
                    currentLongitude: longitude,
                    lastLocationUpdate: new Date()
                }
            });

            // Save location history
            await prisma.deliveryLocation.create({
                data: {
                    deliveryId,
                    latitude,
                    longitude,
                    speed,
                    heading,
                    accuracy
                }
            });

            // Emit WebSocket event for real-time updates
            // TODO: Integrate with WebSocket service
            // socketService.emitLocationUpdate(deliveryId, { latitude, longitude });

            res.json(updatedDelivery);
        } catch (error) {
            console.error('Error updating location:', error);
            res.status(500).json({ message: 'Failed to update location' });
        }
    },

    // Get current delivery location (for customers)
    async getDeliveryLocation(req: Request, res: Response) {
        try {
            const { deliveryId } = req.params;

            const delivery = await prisma.delivery.findUnique({
                where: { id: deliveryId },
                include: {
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                            deliveryAddress: {
                                select: {
                                    latitude: true,
                                    longitude: true,
                                    addressLine1: true,
                                    city: true
                                }
                            },
                            shop: {
                                select: {
                                    name: true,
                                    latitude: true,
                                    longitude: true,
                                    address: true
                                }
                            }
                        }
                    },
                    deliveryPartner: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    name: true,
                                    phone: true
                                }
                            },
                            vehicleType: true,
                            rating: true
                        }
                    }
                }
            });

            if (!delivery) {
                return res.status(404).json({ message: 'Delivery not found' });
            }

            res.json({
                delivery: {
                    id: delivery.id,
                    currentLocation: {
                        latitude: delivery.currentLatitude,
                        longitude: delivery.currentLongitude,
                        lastUpdate: delivery.lastLocationUpdate
                    },
                    isTracking: delivery.isTracking,
                    etaMinutes: delivery.etaMinutes,
                    distanceKm: delivery.distanceKm,
                    routePolyline: delivery.routePolyline
                },
                order: {
                    orderNumber: delivery.order.orderNumber,
                    shopLocation: {
                        name: delivery.order.shop.name,
                        latitude: delivery.order.shop.latitude,
                        longitude: delivery.order.shop.longitude,
                        address: delivery.order.shop.address
                    },
                    deliveryLocation: {
                        latitude: delivery.order.deliveryAddress.latitude,
                        longitude: delivery.order.deliveryAddress.longitude,
                        address: delivery.order.deliveryAddress.addressLine1,
                        city: delivery.order.deliveryAddress.city
                    }
                },
                deliveryPartner: {
                    name: delivery.deliveryPartner.user.name,
                    phone: delivery.deliveryPartner.user.phone,
                    vehicleType: delivery.deliveryPartner.vehicleType,
                    rating: delivery.deliveryPartner.rating
                }
            });
        } catch (error) {
            console.error('Error fetching delivery location:', error);
            res.status(500).json({ message: 'Failed to fetch delivery location' });
        }
    },

    // Get location history
    async getLocationHistory(req: Request, res: Response) {
        try {
            const { deliveryId } = req.params;
            const { limit = 50 } = req.query;

            const locations = await prisma.deliveryLocation.findMany({
                where: { deliveryId },
                orderBy: { timestamp: 'desc' },
                take: Number(limit)
            });

            res.json(locations);
        } catch (error) {
            console.error('Error fetching location history:', error);
            res.status(500).json({ message: 'Failed to fetch location history' });
        }
    },

    // Update route and ETA
    async updateRoute(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const { deliveryId } = req.params;
            const { routePolyline, distanceKm, etaMinutes } = req.body;

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
            if (!partner) return res.status(403).json({ message: 'Partner profile not found' });

            // Verify delivery belongs to this partner
            const delivery = await prisma.delivery.findFirst({
                where: {
                    id: deliveryId,
                    deliveryPartnerId: partner.id
                }
            });

            if (!delivery) {
                return res.status(404).json({ message: 'Delivery not found' });
            }

            // Update route information
            const updatedDelivery = await prisma.delivery.update({
                where: { id: deliveryId },
                data: {
                    routePolyline,
                    distanceKm,
                    etaMinutes,
                    estimatedDeliveryAt: new Date(Date.now() + etaMinutes * 60 * 1000)
                }
            });

            res.json(updatedDelivery);
        } catch (error) {
            console.error('Error updating route:', error);
            res.status(500).json({ message: 'Failed to update route' });
        }
    },

    // Stop tracking
    async stopTracking(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const { deliveryId } = req.params;

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
            if (!partner) return res.status(403).json({ message: 'Partner profile not found' });

            // Verify delivery belongs to this partner
            const delivery = await prisma.delivery.findFirst({
                where: {
                    id: deliveryId,
                    deliveryPartnerId: partner.id
                }
            });

            if (!delivery) {
                return res.status(404).json({ message: 'Delivery not found' });
            }

            // Stop tracking
            const updatedDelivery = await prisma.delivery.update({
                where: { id: deliveryId },
                data: {
                    isTracking: false
                }
            });

            res.json(updatedDelivery);
        } catch (error) {
            console.error('Error stopping tracking:', error);
            res.status(500).json({ message: 'Failed to stop tracking' });
        }
    },

    // Get active deliveries for delivery partner
    async getActiveDeliveries(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
            if (!partner) return res.status(403).json({ message: 'Partner profile not found' });

            const deliveries = await prisma.delivery.findMany({
                where: {
                    deliveryPartnerId: partner.id,
                    isTracking: true
                },
                include: {
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                            status: true,
                            deliveryAddress: {
                                select: {
                                    addressLine1: true,
                                    city: true,
                                    latitude: true,
                                    longitude: true
                                }
                            },
                            shop: {
                                select: {
                                    name: true,
                                    latitude: true,
                                    longitude: true
                                }
                            }
                        }
                    }
                }
            });

            res.json(deliveries);
        } catch (error) {
            console.error('Error fetching active deliveries:', error);
            res.status(500).json({ message: 'Failed to fetch active deliveries' });
        }
    }
};

// Helper function to calculate distance between two points (Haversine formula)
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// Helper function to calculate ETA based on distance and average speed
export function calculateETA(distanceKm: number, averageSpeedKmh = 30): number {
    const hours = distanceKm / averageSpeedKmh;
    const minutes = Math.ceil(hours * 60);
    return minutes;
}
