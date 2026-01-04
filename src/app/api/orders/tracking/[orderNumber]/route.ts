import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';

// =============================================================================
// GET /api/orders/tracking/[orderNumber] - Public tracking
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    await connectDB();

    const { orderNumber } = params;

    const order = await Order.findOne({ orderNumber })
      .populate('deliveryMan', 'name phone currentLocation')
      .lean();

    if (!order) {
      return notFoundResponse('Order not found');
    }

    return successResponse({
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      deliveryAddress: order.deliveryAddress,
      deliveryMan: order.deliveryMan,
      createdAt: order.createdAt,
      estimatedDelivery: order.estimatedDelivery,
      statusHistory: order.statusHistory,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
