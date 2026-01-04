import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAuth } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { restockOrderItems } from '@/lib/orders/restock';

export const POST = withAuth(async (request: NextRequest, { user, params }) => {
  try {
    await connectDB();

    const id = params?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 200) : 'Customer cancelled';

    const order = await Order.findById(id);
    if (!order) return notFoundResponse('Order not found');

    // Customer ownership check
    if (String(order.customer) !== user.id) {
      return errorResponse('Forbidden', 403);
    }

    // Customer cancellation rules (safe):
    // - Only if status is pending or confirmed
    // - Only if NOT assigned to a delivery man yet
    // - Only if not paid via Stripe yet
    const cancellableStatuses = ['pending', 'confirmed'] as const;

    if (!cancellableStatuses.includes(order.status as any)) {
      return errorResponse('Order can no longer be cancelled', 400);
    }

    if (order.deliveryMan) {
      return errorResponse('Order is already assigned and cannot be cancelled by customer', 400);
    }

    if (order.paymentMethod === 'stripe' && order.paymentStatus === 'paid') {
      return errorResponse('Paid orders require admin cancellation/refund', 400);
    }

    if (order.status === 'cancelled') {
      return successResponse({ _id: order._id.toString() }, 'Order already cancelled');
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason,
    });

    await order.save();

    // Restock (idempotent)
    await restockOrderItems(order._id.toString());

    return successResponse({ _id: order._id.toString() }, 'Order cancelled');
  } catch (error) {
    return serverErrorResponse(error);
  }
});
