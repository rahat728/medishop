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
} from '@/lib/api-response';

// =============================================================================
// GET /api/orders/[id] - Get single order (admin only)
// =============================================================================

export const GET = withAdmin(async (request, { user, params }) => {
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

        return successResponse(order);
    } catch (error) {
        return serverErrorResponse(error);
    }
});

// =============================================================================
// PUT /api/orders/[id] - Update order (admin only)
// =============================================================================

export const PUT = withAdmin(async (request, { user, params }) => {
    try {
        await connectDB();

        const id = params?.id;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse('Invalid order ID', 400);
        }

        const body = await request.json();

        // Only allow updating specific fields
        const allowedFields = ['deliveryNotes', 'notes', 'estimatedDelivery'];
        const updateData: any = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .populate('customer', 'name email phone')
            .populate('deliveryMan', 'name email phone');

        if (!order) {
            return notFoundResponse('Order not found');
        }

        return successResponse(order, 'Order updated successfully');
    } catch (error) {
        return serverErrorResponse(error);
    }
});
