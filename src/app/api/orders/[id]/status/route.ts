import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import {
    successResponse,
    errorResponse,
    serverErrorResponse,
    notFoundResponse,
    validationErrorResponse,
} from '@/lib/api-response';
import {
    updateOrderStatusSchema,
    ORDER_STATUS_CONFIG,
    type OrderStatus,
} from '@/lib/validations/order';

// =============================================================================
// PUT /api/orders/[id]/status - Update order status (admin only)
// =============================================================================

export const PUT = withAdmin(async (request, { user, params }) => {
    try {
        await connectDB();

        const id = params?.id;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse('Invalid order ID', 400);
        }

        const body = await request.json();

        // Validate input
        const validationResult = updateOrderStatusSchema.safeParse(body);

        if (!validationResult.success) {
            return validationErrorResponse(
                validationResult.error.issues.map((e) => e.message)
            );
        }

        const { status: newStatus, note } = validationResult.data;

        // Find order
        const order = await Order.findById(id);

        if (!order) {
            return notFoundResponse('Order not found');
        }

        const currentStatus = order.status as OrderStatus;
        const statusConfig = ORDER_STATUS_CONFIG[currentStatus];

        // Check if transition is valid
        if (!statusConfig.nextStatuses.includes(newStatus)) {
            return errorResponse(
                `Cannot change status from "${currentStatus}" to "${newStatus}". ` +
                `Valid next statuses: ${statusConfig.nextStatuses.join(', ') || 'none'}`,
                400
            );
        }

        // Update status
        order.status = newStatus;
        order.statusHistory.push({
            status: newStatus,
            timestamp: new Date(),
            note,
            updatedBy: new mongoose.Types.ObjectId(user.id),
        });

        // Handle special status updates
        if (newStatus === 'delivered') {
            order.actualDelivery = new Date();
        }

        if (newStatus === 'cancelled') {
            order.cancelledAt = new Date();
            order.cancellationReason = note;
        }

        await order.save();

        // Populate and return
        await order.populate('customer', 'name email');
        await order.populate('deliveryMan', 'name email');

        return successResponse(order, `Order status updated to "${newStatus}"`);
    } catch (error) {
        return serverErrorResponse(error);
    }
});

// =============================================================================
// GET /api/orders/[id]/status - Get status history (admin only)
// =============================================================================

export const GET = withAdmin(async (request, { user, params }) => {
    try {
        await connectDB();

        const id = params?.id;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse('Invalid order ID', 400);
        }

        const order = await Order.findById(id)
            .select('orderNumber status statusHistory')
            .populate('statusHistory.updatedBy', 'name email')
            .lean();

        if (!order) {
            return notFoundResponse('Order not found');
        }

        return successResponse({
            orderNumber: order.orderNumber,
            currentStatus: order.status,
            history: order.statusHistory,
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
});
