import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api-response';

const ACTIVE_STATUSES = ['assigned', 'picked_up', 'on_the_way'] as const;

// GET /api/admin/tracking/active
// Returns all active deliveries with best-available driver coords.
export const GET = withAdmin(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // optional filter
    const hasCoords = searchParams.get('hasCoords'); // 'true' | 'false'

    const query: any = {
      status: { $in: ACTIVE_STATUSES },
    };

    if (status && ACTIVE_STATUSES.includes(status as any)) {
      query.status = status;
    }

    // Load active orders with driver + customer
    const orders = await Order.find(query)
      .populate('customer', 'name phone email')
      .populate('deliveryMan', 'name phone lastLocation')
      .select(
        'orderNumber status paymentStatus totalAmount deliveryAddress deliveryLocation deliveryMan customer createdAt updatedAt'
      )
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const items = orders.map((o: any) => {
      const destinationCoords =
        o.deliveryAddress?.coordinates?.lat != null && o.deliveryAddress?.coordinates?.lng != null
          ? { lat: o.deliveryAddress.coordinates.lat, lng: o.deliveryAddress.coordinates.lng }
          : null;

      // Prefer order.deliveryLocation (Day 17), fallback to driver.lastLocation (Day 2)
      const driverCoords =
        o.deliveryLocation?.lat != null && o.deliveryLocation?.lng != null
          ? {
              lat: o.deliveryLocation.lat,
              lng: o.deliveryLocation.lng,
              updatedAt: o.deliveryLocation.updatedAt,
              source: 'order.deliveryLocation',
            }
          : o.deliveryMan?.lastLocation?.lat != null && o.deliveryMan?.lastLocation?.lng != null
            ? {
                lat: o.deliveryMan.lastLocation.lat,
                lng: o.deliveryMan.lastLocation.lng,
                updatedAt: o.deliveryMan.lastLocation.updatedAt,
                source: 'user.lastLocation',
              }
            : null;

      return {
        _id: o._id.toString(),
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        customer: o.customer
          ? {
              _id: o.customer._id?.toString?.() || '',
              name: o.customer.name,
              phone: o.customer.phone,
              email: o.customer.email,
            }
          : null,
        deliveryMan: o.deliveryMan
          ? {
              _id: o.deliveryMan._id?.toString?.() || '',
              name: o.deliveryMan.name,
              phone: o.deliveryMan.phone,
            }
          : null,
        destinationCoords,
        driverCoords,
        deliveryAddress: o.deliveryAddress || null,
      };
    });

    let filtered = items;

    if (hasCoords === 'true') {
      filtered = filtered.filter((x) => !!x.driverCoords);
    }
    if (hasCoords === 'false') {
      filtered = filtered.filter((x) => !x.driverCoords);
    }

    // Summary
    const summary = {
      total: items.length,
      withDriverCoords: items.filter((x) => !!x.driverCoords).length,
      withoutDriverCoords: items.filter((x) => !x.driverCoords).length,
      byStatus: {
        assigned: items.filter((x) => x.status === 'assigned').length,
        picked_up: items.filter((x) => x.status === 'picked_up').length,
        on_the_way: items.filter((x) => x.status === 'on_the_way').length,
      },
    };

    return successResponse({ orders: filtered, summary });
  } catch (error) {
    return serverErrorResponse(error);
  }
});
