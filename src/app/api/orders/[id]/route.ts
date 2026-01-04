import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAuth } from '@/lib/auth';
import {
    successResponse,
    errorResponse,
    serverErrorResponse,
    notFoundResponse,
} from '@/lib/api-response';

// =============================================================================
// GET /api/orders/[id] - Get single order
// =============================================================================

export const GET = withAuth(async (request, { user, params }) => {
    try {
        await connectDB();

        const id = params?.id;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse('Invalid order ID', 400);
        }

        const order = await Order.findById(id)
            .populate('customer', 'name email phone address')
            .populate('deliveryMan', 'name email phone')
            .populate('items.medicine', 'name image price')
            .lean();

        if (!order) {
            return notFoundResponse('Order not found');
        }

        // Access Control: Admin, Delivery Partner assigned to this order, or the Customer who placed it
        const isAdmin = user.role === 'admin';
        const isDelivery = user.role === 'delivery' && order.deliveryMan?._id?.toString() === user.id;
        const isCustomer = user.role === 'customer' && order.customer?._id?.toString() === user.id;

        if (!isAdmin && !isDelivery && !isCustomer) {
            return errorResponse('Insufficient permissions', 403);
        }

        return successResponse(order);
    } catch (error) {
        return serverErrorResponse(error);
    }
});

// =============================================================================
// PUT /api/orders/[id] - Update order (admin or delivery)
// =============================================================================

export const PUT = withAuth(async (request, { user, params }) => {
    try {
        await connectDB();

        const id = params?.id;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse('Invalid order ID', 400);
        }

        const body = await request.json();
        const { status, note, deliveryManId, deliveryNotes, notes, estimatedDelivery } = body;

        const order = await Order.findById(id).populate('customer');

        if (!order) {
            return notFoundResponse('Order not found');
        }

        const isAdmin = user.role === 'admin';
        const isDelivery = user.role === 'delivery' && (
            order.deliveryMan?.toString() === user.id ||
            (order.deliveryMan as any)?._id?.toString() === user.id
        );

        if (!isAdmin && !isDelivery) {
            return errorResponse('Insufficient permissions', 403);
        }

        // Update status if provided
        if (status) {
            const validAdminStatuses = ['pending', 'confirmed', 'assigned', 'picked_up', 'on_the_way', 'delivered', 'cancelled'];
            const validDeliveryStatuses = ['picked_up', 'on_the_way', 'delivered'];

            const allowedStatuses = isAdmin ? validAdminStatuses : validDeliveryStatuses;

            if (!allowedStatuses.includes(status)) {
                return errorResponse(`Invalid or unauthorized status update: ${status}`, 400);
            }

            order.status = status;
            order.statusHistory.push({
                status,
                timestamp: new Date(),
                note: note || `Status updated to ${status}`,
                updatedBy: new mongoose.Types.ObjectId(user.id),
            });
        }

        // Handle Assignment (Admin Only)
        if (deliveryManId && isAdmin) {
            if (deliveryManId === 'none') {
                order.deliveryMan = undefined;
            } else if (mongoose.Types.ObjectId.isValid(deliveryManId)) {
                order.deliveryMan = new mongoose.Types.ObjectId(deliveryManId);
                // Auto-update status to assigned if currently pending or confirmed
                if (['pending', 'confirmed'].includes(order.status)) {
                    order.status = 'assigned';
                    order.statusHistory.push({
                        status: 'assigned',
                        timestamp: new Date(),
                        note: 'Delivery partner assigned',
                        updatedBy: new mongoose.Types.ObjectId(user.id),
                    });
                }
            }
        }

        // Update basic fields
        if (deliveryNotes !== undefined) order.deliveryNotes = deliveryNotes;
        if (notes !== undefined) order.notes = notes;
        if (estimatedDelivery !== undefined) order.estimatedDelivery = estimatedDelivery;

        await order.save();

        // Populate for response
        const updatedOrder = await Order.findById(id)
            .populate('customer', 'name email phone')
            .populate('deliveryMan', 'name email phone');

        return successResponse(updatedOrder, 'Order updated successfully');
    } catch (error) {
        return serverErrorResponse(error);
    }
});
