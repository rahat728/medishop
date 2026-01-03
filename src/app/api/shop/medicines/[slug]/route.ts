import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import {
    successResponse,
    notFoundResponse,
    serverErrorResponse,
} from '@/lib/api-response';

// =============================================================================
// GET /api/shop/medicines/[slug] - Get single medicine by slug
// =============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        await connectDB();

        const { slug } = await params;

        const medicine = await Medicine.findOne({
            slug,
            isActive: true,
        })
            .select('-__v')
            .lean();

        if (!medicine) {
            return notFoundResponse('Medicine not found');
        }

        // Get related medicines (same category)
        const related = await Medicine.find({
            category: medicine.category,
            _id: { $ne: medicine._id },
            isActive: true,
            stock: { $gt: 0 },
        })
            .select('name slug price compareAtPrice image category manufacturer')
            .limit(4)
            .lean();

        return successResponse({
            medicine: {
                ...medicine,
                _id: (medicine as any)._id.toString(),
                inStock: medicine.stock > 0,
                discountPercentage: medicine.compareAtPrice && medicine.compareAtPrice > medicine.price
                    ? Math.round(((medicine.compareAtPrice - medicine.price) / medicine.compareAtPrice) * 100)
                    : 0,
            },
            related: related.map((m: any) => ({
                ...m,
                _id: m._id.toString(),
            })),
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
}
