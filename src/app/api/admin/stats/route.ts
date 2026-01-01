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

    return successResponse({
      totalOrders: orderCount,
      totalMedicines: medicineCount,
      totalDeliveryMen: deliveryCount,
      totalCustomers: customerCount,
      todayOrders,
      todayRevenue: todayRevenue[0]?.total || 0,
      requestedBy: user.email,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
});
