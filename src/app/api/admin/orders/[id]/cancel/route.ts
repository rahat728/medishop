import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { restockOrderItems } from '@/lib/orders/restock';

export const POST = withAdmin(async (request: NextRequest, { user, params }) => {
  try {
    await connectDB();

    const id = params?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 200) : 'Admin cancelled';
    const restock = body?.restock !== false; // default true

    const order = await Order.findById(id);
    if (!order) return notFoundResponse('Order not found');

    if (order.status === 'delivered') {
      return errorResponse('Delivered orders cannot be cancelled', 400);
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
      updatedBy: new mongoose.Types.ObjectId(user.id),
    });

    await order.save();

    if (restock) {
      await restockOrderItems(order._id.toString());
    }

    return successResponse({ _id: order._id.toString() }, 'Order cancelled (admin)');
  } catch (error) {
    return serverErrorResponse(error);
  }
});
