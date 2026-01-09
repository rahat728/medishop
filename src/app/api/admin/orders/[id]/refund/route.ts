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
import { getStripe } from '@/lib/stripe';
import { restockOrderItems } from '@/lib/orders/restock';

export const POST = withAdmin(async (request: NextRequest, { user, params }) => {
  try {
    await connectDB();

    const id = params?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const body = await request.json().catch(() => ({}));
    const amount = typeof body?.amount === 'number' ? body.amount : null; // dollars
    const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 200) : 'Admin refund';
    const cancelOrder = body?.cancelOrder !== false; // default true
    const restock = body?.restock !== false; // default true

    const order = await Order.findById(id);
    if (!order) return notFoundResponse('Order not found');

    if (order.paymentMethod !== 'stripe') {
      return errorResponse('Refund is only available for Stripe payments', 400);
    }

    if (!order.paymentIntentId) {
      return errorResponse('Order has no paymentIntentId', 400);
    }

    if (order.paymentStatus !== 'paid') {
      return errorResponse(`Order paymentStatus must be "paid" to refund. Current: ${order.paymentStatus}`, 400);
    }

    // Stripe refund
    const refundParams: any = {
      payment_intent: order.paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        adminUserId: user.id,
      },
    };

    if (amount !== null) {
      if (amount <= 0) return errorResponse('Refund amount must be > 0', 400);
      refundParams.amount = Math.round(amount * 100); // cents
    }

    const stripe = getStripe();
    const refund = await stripe.refunds.create(refundParams);

    // Update order
    order.paymentStatus = 'refunded';
    order.refundedAt = new Date();
    order.refundAmount = amount !== null ? amount : order.totalAmount;

    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: `Refunded via Stripe (${refund.id}). ${reason}`,
      updatedBy: new mongoose.Types.ObjectId(user.id),
    });

    if (cancelOrder && order.status !== 'delivered' && order.status !== 'cancelled') {
      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.cancellationReason = reason;
      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: `Cancelled after refund. ${reason}`,
        updatedBy: new mongoose.Types.ObjectId(user.id),
      });
    }

    await order.save();

    if (cancelOrder && restock && order.status === 'cancelled') {
      await restockOrderItems(order._id.toString());
    }

    return successResponse(
      {
        orderId: order._id.toString(),
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
      },
      'Refund created'
    );
  } catch (error: any) {
    return serverErrorResponse(error);
  }
});
