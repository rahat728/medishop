import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAuth } from '@/lib/auth';
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';

export const GET = withAuth(async (request: NextRequest, { user, params }) => {
  try {
    await connectDB();

    const id = params?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const order = await Order.findById(id)
      .populate('customer', 'name email phone')
      .populate('deliveryMan', 'name phone lastLocation')
      .select('orderNumber status paymentStatus deliveryAddress deliveryLocation deliveryMan customer createdAt updatedAt estimatedDelivery actualDelivery')
      .lean();

    if (!order) return notFoundResponse('Order not found');

    const role = (user as any).role;

    // Authorization:
    // - customer can see only their order
    // - admin can see any
    // - delivery can see if assigned
    const customerId = (order as any).customer?._id?.toString?.() || (order as any).customer?.toString?.();
    const deliveryManId = (order as any).deliveryMan?._id?.toString?.() || (order as any).deliveryMan?.toString?.();

    const isAdmin = role === 'admin';
    const isCustomerOwner = role === 'customer' && customerId === user.id;
    const isAssignedDriver = role === 'delivery' && deliveryManId === user.id;

    if (!isAdmin && !isCustomerOwner && !isAssignedDriver) {
      return errorResponse('Forbidden', 403);
    }

    const destinationCoords =
      (order as any).deliveryAddress?.coordinates?.lat != null &&
      (order as any).deliveryAddress?.coordinates?.lng != null
        ? {
            lat: (order as any).deliveryAddress.coordinates.lat,
            lng: (order as any).deliveryAddress.coordinates.lng,
          }
        : null;

    // Prefer order.deliveryLocation (updated by Day 17 /api/location)
    const driverCoords =
      (order as any).deliveryLocation?.lat != null && (order as any).deliveryLocation?.lng != null
        ? {
            lat: (order as any).deliveryLocation.lat,
            lng: (order as any).deliveryLocation.lng,
            updatedAt: (order as any).deliveryLocation.updatedAt,
            source: 'order.deliveryLocation',
          }
        : (order as any).deliveryMan?.lastLocation?.lat != null && (order as any).deliveryMan?.lastLocation?.lng != null
          ? {
              lat: (order as any).deliveryMan.lastLocation.lat,
              lng: (order as any).deliveryMan.lastLocation.lng,
              updatedAt: (order as any).deliveryMan.lastLocation.updatedAt,
              source: 'user.lastLocation',
            }
          : null;

    return successResponse({
      _id: (order as any)._id.toString(),
      orderNumber: (order as any).orderNumber,
      status: (order as any).status,
      paymentStatus: (order as any).paymentStatus,
      createdAt: (order as any).createdAt,
      updatedAt: (order as any).updatedAt,
      estimatedDelivery: (order as any).estimatedDelivery,
      actualDelivery: (order as any).actualDelivery,
      deliveryAddress: (order as any).deliveryAddress,
      destinationCoords,
      driverCoords,
      deliveryMan: (order as any).deliveryMan
        ? {
            _id: (order as any).deliveryMan._id.toString(),
            name: (order as any).deliveryMan.name,
            phone: (order as any).deliveryMan.phone,
          }
        : null,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
});
