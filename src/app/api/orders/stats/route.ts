import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import { successResponse, serverErrorResponse } from '@/lib/api-response';

// =============================================================================
// GET /api/orders/stats - Get order statistics (admin only)
// =============================================================================

export const GET = withAdmin(async (request, { user }) => {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default: // 7d
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Get orders by status
        const byStatus = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' },
                },
            },
        ]);

        // Get orders by day
        const byDay = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    count: { $sum: 1 },
                    revenue: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0],
                        },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Get summary
        const [summary] = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0],
                        },
                    },
                    avgOrderValue: {
                        $avg: {
                            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', null],
                        },
                    },
                    deliveredOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
                    },
                    cancelledOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
                    },
                },
            },
        ]);

        return successResponse({
            period,
            summary: summary || {
                totalOrders: 0,
                totalRevenue: 0,
                avgOrderValue: 0,
                deliveredOrders: 0,
                cancelledOrders: 0,
            },
            byStatus,
            byDay,
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
});
