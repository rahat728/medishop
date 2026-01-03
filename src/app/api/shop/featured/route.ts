import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import { successResponse, serverErrorResponse } from '@/lib/api-response';

// =============================================================================
// GET /api/shop/featured - Get featured medicines
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20);

        const featured = await Medicine.find({
            isActive: true,
            isFeatured: true,
            stock: { $gt: 0 },
        })
            .select('name slug description price compareAtPrice category stock image manufacturer')
            .limit(limit)
            .lean();

        return successResponse({
            medicines: featured.map((med: any) => ({
                ...med,
                _id: med._id.toString(),
                inStock: med.stock > 0,
                discountPercentage: med.compareAtPrice && med.compareAtPrice > med.price
                    ? Math.round(((med.compareAtPrice - med.price) / med.compareAtPrice) * 100)
                    : 0,
            })),
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
}
