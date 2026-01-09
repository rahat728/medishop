import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  createdResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import {
  createMedicineSchema,
  medicineQuerySchema,
} from '@/lib/validations/medicine';

// =============================================================================
// GET /api/medicines - List all medicines (public with auth)
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Parse and validate query params
    const queryResult = medicineQuerySchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      inStock: searchParams.get('inStock') || undefined,
      featured: searchParams.get('featured') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    });

    if (!queryResult.success) {
      return validationErrorResponse(
        queryResult.error.issues.map((e) => e.message)
      );
    }

    const {
      page,
      limit,
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      featured,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build query
    const query: any = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    if (inStock !== undefined) {
      query.stock = inStock ? { $gt: 0 } : 0;
    }

    if (featured !== undefined) {
      query.isFeatured = featured;
    }

    // Get total count
    const total = await Medicine.countDocuments(query);

    // Get paginated results
    const medicines = await Medicine.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return successResponse<any>({
      medicines,
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

// =============================================================================
// POST /api/medicines - Create new medicine (admin only)
// =============================================================================

export const POST = withAdmin(async (request, { user }) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate input
    const validationResult = createMedicineSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(
        validationResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
      );
    }

    const medicineData = validationResult.data;

    // Create medicine
    const medicine = await Medicine.create(medicineData);

    return createdResponse(medicine, 'Medicine created successfully');
  } catch (error: any) {
    if (error.code === 11000) {
      return errorResponse('A medicine with this name already exists', 409);
    }
    return serverErrorResponse(error);
  }
});
