import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import { successResponse, serverErrorResponse } from '@/lib/api-response';

// =============================================================================
// GET /api/shop/categories - Get categories with counts
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const categories = await Medicine.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    inStock: {
                        $sum: { $cond: [{ $gt: ['$stock', 0] }, 1, 0] },
                    },
                },
            },
            { $sort: { count: -1 } },
        ]);

        // Format categories
        const formattedCategories = categories.map((cat) => ({
            name: cat._id,
            slug: cat._id.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
            count: cat.count,
            inStock: cat.inStock,
        }));

        // Get total products
        const totalProducts = categories.reduce((sum, cat) => sum + cat.count, 0);

        return successResponse({
            categories: formattedCategories,
            totalProducts,
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
}
