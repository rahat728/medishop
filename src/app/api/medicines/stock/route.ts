import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import { successResponse, serverErrorResponse } from '@/lib/api-response';

// =============================================================================
// GET /api/medicines/stock - Get stock overview (admin only)
// =============================================================================

export const GET = withAdmin(async (request, { user }) => {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter'); // 'low', 'out', 'all'

        // Build query based on filter
        let query: any = { isActive: true };

        if (filter === 'low') {
            query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
            query.stock = { $gt: 0 };
        } else if (filter === 'out') {
            query.stock = 0;
        }

        // Get medicines
        const medicines = await Medicine.find(query)
            .select('name slug stock lowStockThreshold category image manufacturer')
            .sort({ stock: 1 })
            .lean();

        // Get summary statistics
        const [summary] = await Medicine.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalStock: { $sum: '$stock' },
                    outOfStock: {
                        $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] },
                    },
                    lowStock: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $gt: ['$stock', 0] },
                                        { $lte: ['$stock', '$lowStockThreshold'] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    healthyStock: {
                        $sum: {
                            $cond: [{ $gt: ['$stock', '$lowStockThreshold'] }, 1, 0],
                        },
                    },
                },
            },
        ]);

        // Get stock by category
        const byCategory = await Medicine.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalStock: { $sum: '$stock' },
                    outOfStock: {
                        $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] },
                    },
                    lowStock: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $gt: ['$stock', 0] },
                                        { $lte: ['$stock', '$lowStockThreshold'] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            { $sort: { outOfStock: -1, lowStock: -1 } },
        ]);

        return successResponse({
            medicines,
            summary: summary || {
                totalProducts: 0,
                totalStock: 0,
                outOfStock: 0,
                lowStock: 0,
                healthyStock: 0,
            },
            byCategory,
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
});
