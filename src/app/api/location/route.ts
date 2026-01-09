import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { User, Order } from '@/lib/db/models';
import { withDelivery } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { z } from 'zod';

const updateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  orderId: z.string().optional(), // optional: attach to a specific active order
});

// PUT /api/location (delivery-only)
// Updates:
//  - User.lastLocation
//  - Order.deliveryLocation (for active order or specified orderId)
export const PUT = withDelivery(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.map((e) => e.message));
    }

    const { lat, lng, orderId } = parsed.data;

    // Update driver location on User
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      {
        $set: {
          lastLocation: { lat, lng, updatedAt: new Date() },
        },
      },
      { new: true }
    ).select('name role lastLocation');

    if (!updatedUser) {
      return notFoundResponse('User not found');
    }

    // Update active order deliveryLocation
    let updatedOrderId: string | null = null;

    const activeStatuses = ['picked_up', 'on_the_way'];

    if (orderId) {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return errorResponse('Invalid orderId', 400);
      }

      const order = await Order.findOne({
        _id: orderId,
        deliveryMan: user.id,
        status: { $in: activeStatuses },
      });

      if (order) {
        order.deliveryLocation = { lat, lng, updatedAt: new Date() };
        await order.save();
        updatedOrderId = order._id.toString();
      }
    } else {
      const order = await Order.findOne({
        deliveryMan: user.id,
        status: { $in: activeStatuses },
      }).sort({ updatedAt: -1, createdAt: -1 });

      if (order) {
        order.deliveryLocation = { lat, lng, updatedAt: new Date() };
        await order.save();
        updatedOrderId = order._id.toString();
      }
    }

    return successResponse({
      driver: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        lastLocation: updatedUser.lastLocation,
      },
      updatedOrderId,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
});

// GET /api/location (delivery-only) - current driver last location and active order
export const GET = withDelivery(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const me = await User.findById(user.id).select('name lastLocation').lean();
    if (!me) return notFoundResponse('User not found');

    const activeOrder = await Order.findOne({
      deliveryMan: user.id,
      status: { $in: ['picked_up', 'on_the_way'] },
    })
      .select('orderNumber status deliveryLocation')
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    return successResponse({
      driver: {
        id: me._id.toString(),
        name: (me as any).name,
        lastLocation: (me as any).lastLocation || null,
      },
      activeOrder: activeOrder
        ? {
          id: activeOrder._id.toString(),
          orderNumber: (activeOrder as any).orderNumber,
          status: (activeOrder as any).status,
          deliveryLocation: (activeOrder as any).deliveryLocation || null,
        }
        : null,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
});
