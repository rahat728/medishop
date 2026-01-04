import { NextRequest } from 'next/server';
import { withAdmin } from '@/lib/auth';
import { successResponse, serverErrorResponse } from '@/lib/api-response';
import connectDB from '@/lib/db/mongoose';
import { Order, Medicine, User } from '@/lib/db/models';

// GET /api/admin/stats - Admin-only stats endpoint
export const GET = withAdmin(async (request, { user }) => {
  try {
    await connectDB();

    // Get counts
    const [orderCount, medicineCount, deliveryCount, customerCount] = await Promise.all([
      Order.countDocuments(),
      Medicine.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'delivery', isActive: true }),
      User.countDocuments({ role: 'customer', isActive: true }),
    ]);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today },
    });

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    // Get revenue trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const revenueTrends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top selling medicines
    const topMedicines = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicine',
          name: { $first: '$items.name' },
          totalQty: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
    ]);

    // Status distribution
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return successResponse({
      totalOrders: orderCount,
      totalMedicines: medicineCount,
      totalDeliveryMen: deliveryCount,
      totalCustomers: customerCount,
      todayOrders,
      todayRevenue: todayRevenue[0]?.total || 0,
      revenueTrends,
      topMedicines,
      statusDistribution,
      requestedBy: user.email,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
});
