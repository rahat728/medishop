import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    await connectDB();

    const orderNumber = params.orderNumber;

    const order = await Order.findOne({ orderNumber })
      .populate('deliveryMan', 'name phone lastLocation')
      .select('orderNumber status deliveryAddress deliveryLocation estimatedDelivery actualDelivery statusHistory deliveryMan createdAt')
      .lean();

    if (!order) {
      return notFoundResponse('Order not found');
    }

    return successResponse({
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      estimatedDelivery: order.estimatedDelivery,
      actualDelivery: order.actualDelivery,
      deliveryAddress: order.deliveryAddress,
      deliveryLocation: order.deliveryLocation,
      deliveryMan: order.deliveryMan
        ? {
            _id: (order.deliveryMan as any)._id.toString(),
            name: (order.deliveryMan as any).name,
            phone: (order.deliveryMan as any).phone,
            lastLocation: (order.deliveryMan as any).lastLocation,
          }
        : null,
      statusHistory: order.statusHistory || [],
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
