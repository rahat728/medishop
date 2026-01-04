import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';

function mapStripeToPaymentStatus(piStatus: string) {
  // Very simplified mapping
  switch (piStatus) {
    case 'succeeded':
      return 'paid';
    case 'processing':
    case 'requires_confirmation':
    case 'requires_action':
    case 'requires_payment_method':
      return 'pending';
    case 'canceled':
      return 'failed';
    default:
      return 'pending';
  }
}

export const POST = withAdmin(async (request: NextRequest, { user, params }) => {
  try {
    await connectDB();

    const id = params?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const order = await Order.findById(id);
    if (!order) return notFoundResponse('Order not found');

    if (order.paymentMethod !== 'stripe') {
      return errorResponse('Only Stripe orders can be synced', 400);
    }

    if (!order.paymentIntentId) {
      return errorResponse('Order has no paymentIntentId', 400);
    }

    const pi = await stripe.paymentIntents.retrieve(order.paymentIntentId);
    const mapped = mapStripeToPaymentStatus(pi.status);

    const prev = order.paymentStatus;
    order.paymentStatus = mapped as any;

    if (mapped === 'paid' && !order.paidAt) {
      order.paidAt = new Date();
    }

    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: `Admin sync payment: Stripe PI=${pi.id} status=${pi.status} -> paymentStatus=${mapped} (prev=${prev})`,
      updatedBy: new mongoose.Types.ObjectId(user.id),
    });

    await order.save();

    return successResponse(
      { orderId: order._id.toString(), paymentIntentStatus: pi.status, prevPaymentStatus: prev, paymentStatus: order.paymentStatus },
      'Payment status synced'
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
});
