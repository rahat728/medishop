import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response';

function getStartDate(period: string) {
  const now = new Date();
  const msDay = 24 * 60 * 60 * 1000;

  switch (period) {
    case '30d':
      return new Date(now.getTime() - 30 * msDay);
    case '90d':
      return new Date(now.getTime() - 90 * msDay);
    case '7d':
    default:
      return new Date(now.getTime() - 7 * msDay);
  }
}

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    if (!['7d', '30d', '90d'].includes(period)) {
      return errorResponse('Invalid period. Use 7d, 30d, 90d.', 400);
    }

    const startDate = getStartDate(period);
    const endDate = new Date();

    // Summary
    const [summary] = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] },
          },
          avgOrderValue: {
            $avg: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', null] },
          },
          deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        },
      },
    ]);

    // Orders & revenue by day (paid revenue)
    const byDay = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // By status
    const byStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Top products (snapshot name)
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]);

    // Top categories (lookup Medicine by items.medicine)
    const topCategories = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'medicines',
          localField: 'items.medicine',
          foreignField: '_id',
          as: 'medicineDoc',
        },
      },
      { $unwind: { path: '$medicineDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$medicineDoc.category', 'Unknown'] },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]);

    return successResponse({
      period,
      range: { startDate, endDate },
      summary: summary || {
        totalOrders: 0,
        paidOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
      },
      byDay,
      byStatus,
      topProducts,
      topCategories,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
});
