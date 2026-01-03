import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import { successResponse, serverErrorResponse } from '@/lib/api-response';

// =============================================================================
// GET /api/shop/medicines - Public medicine listing
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        // Parse query params
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const minPrice = parseFloat(searchParams.get('minPrice') || '0');
        const maxPrice = parseFloat(searchParams.get('maxPrice') || '10000');
        const sortBy = searchParams.get('sortBy') || 'name';
        const sortOrder = searchParams.get('sortOrder') || 'asc';
        const featured = searchParams.get('featured') === 'true';

        // Build query - only active medicines
        const query: any = {
            isActive: true,
        };

        // Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { manufacturer: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } },
            ];
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Price range
        query.price = { $gte: minPrice, $lte: maxPrice };

        // Featured only
        if (featured) {
            query.isFeatured = true;
        }

        // Sort configuration
        const sortOptions: Record<string, any> = {
            name: { name: sortOrder === 'asc' ? 1 : -1 },
            price: { price: sortOrder === 'asc' ? 1 : -1 },
            newest: { createdAt: -1 },
            popular: { isFeatured: -1, name: 1 },
        };

        const sort = sortOptions[sortBy] || sortOptions.name;

        // Get total count
        const total = await Medicine.countDocuments(query);

        // Get medicines
        const medicines = await Medicine.find(query)
            .select('name slug description price compareAtPrice category stock image manufacturer isFeatured tags')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Transform for public consumption
        const publicMedicines = medicines.map((med: any) => ({
            ...med,
            _id: med._id.toString(),
            inStock: med.stock > 0,
            discountPercentage: med.compareAtPrice && med.compareAtPrice > med.price
                ? Math.round(((med.compareAtPrice - med.price) / med.compareAtPrice) * 100)
                : 0,
        }));

        return successResponse({
            medicines: publicMedicines,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
}
