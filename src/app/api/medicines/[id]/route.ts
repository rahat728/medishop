import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  notFoundResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { updateMedicineSchema } from '@/lib/validations/medicine';

// =============================================================================
// GET /api/medicines/[id] - Get single medicine
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid medicine ID', 400);
    }

    const medicine = await Medicine.findById(id).lean();

    if (!medicine) {
      return notFoundResponse('Medicine not found');
    }

    return successResponse(medicine);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// =============================================================================
// PUT /api/medicines/[id] - Update medicine (admin only)
// =============================================================================

export const PUT = withAdmin(async (request, { user, params }) => {
  try {
    await connectDB();

    const id = params?.id;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid medicine ID', 400);
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateMedicineSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(
        validationResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
      );
    }

    const updateData = validationResult.data;

    // Find and update medicine
    const medicine = await Medicine.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return notFoundResponse('Medicine not found');
    }

    return successResponse<any>(medicine, 'Medicine updated successfully');
  } catch (error: any) {
    if (error.code === 11000) {
      return errorResponse('A medicine with this name already exists', 409);
    }
    return serverErrorResponse(error);
  }
});

// =============================================================================
// DELETE /api/medicines/[id] - Delete medicine (admin only)
// =============================================================================

export const DELETE = withAdmin(async (request, { user, params }) => {
  try {
    await connectDB();

    const id = params?.id;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid medicine ID', 400);
    }

    // Soft delete by setting isActive to false
    const medicine = await Medicine.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!medicine) {
      return notFoundResponse('Medicine not found');
    }

    return successResponse<any>({ id }, 'Medicine deleted successfully');
  } catch (error) {
    return serverErrorResponse(error);
  }
});
