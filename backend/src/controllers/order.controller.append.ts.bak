// Cancel Order
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            shop: {
                select: { userId: true, name: true }
            },
            customer: {
                select: { name: true, phone: true }
            }
        }
    });

    if (!order) {
        return errorResponse(res, 'Order not found', 404);
    }

    // Permission Check
    if (userRole === 'CUSTOMER' && order.customerId !== userId) {
        return errorResponse(res, 'Unauthorized to cancel this order', 403);
    }
    if (userRole === 'VENDOR' && order.shop.userId !== userId) {
        return errorResponse(res, 'Unauthorized to cancel this order', 403);
    }

    // Status Check
    const cancellableStatuses = ['PLACED', 'PENDING'];
    if (!cancellableStatuses.includes(order.status)) {
        return errorResponse(res, `Cannot cancel order in ${order.status} state`, 400);
    }

    // Refund Logic (Mock for now)
    let paymentStatus = order.paymentStatus;
    let paymentTransactionId = order.paymentTransactionId;
    if (order.paymentStatus === 'SUCCESS') {
        // Here you would call Razorpay refund API
        // await razorpay.payments.refund(order.paymentTransactionId)
        console.log(`[REFUND] Initiating refund for Order ${order.orderNumber}, TxId: ${order.paymentTransactionId}, Amount: ${order.total}`);

        // Assume success
        paymentStatus = 'REFUNDED';
    }

    const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
            status: 'CANCELLED',
            paymentStatus: paymentStatus,
            // You might want to store cancellation reason somewhere, currently simple update
        }
    });

    // Notify Parties
    const message = `Order #${order.orderNumber} was cancelled. Reason: ${reason || 'No reason provided'}`;

    // Notify Vendor if Customer cancelled
    if (userRole === 'CUSTOMER' && order.shop?.userId) {
        socketService.emitToUser(order.shop.userId, 'order_update', {
            orderId: order.id,
            status: 'CANCELLED',
            message: `Customer cancelled Order #${order.orderNumber}`
        });
    }

    // Notify Customer if Vendor cancelled (or if Customer cancelled, confirm it)
    socketService.emitToUser(order.customerId, 'order_update', {
        orderId: order.id,
        status: 'CANCELLED',
        message: userRole === 'VENDOR' ? `Shop cancelled your order. Reason: ${reason}` : `Your order #${order.orderNumber} has been cancelled.`
    });

    successResponse(res, updatedOrder, 'Order cancelled successfully');
});
