import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api-response';

// =============================================================================
// POST /api/medicines/bulk - Bulk operations (admin only)
// =============================================================================

export const POST = withAdmin(async (request, { user }) => {
  try {
    await connectDB();

    const { action, ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse('Please provide an array of medicine IDs', 400);
    }

    // Validate all IDs
    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return errorResponse(`Invalid IDs: ${invalidIds.join(', ')}`, 400);
    }

    let result;

    switch (action) {
      case 'delete':
        // Soft delete
        result = await Medicine.updateMany(
          { _id: { $in: ids } },
          { $set: { isActive: false } }
        );
        return successResponse(
          { affected: result.modifiedCount },
          `${result.modifiedCount} medicines deleted`
        );

      case 'activate':
        result = await Medicine.updateMany(
          { _id: { $in: ids } },
          { $set: { isActive: true } }
        );
        return successResponse(
          { affected: result.modifiedCount },
          `${result.modifiedCount} medicines activated`
        );

      case 'feature':
        result = await Medicine.updateMany(
          { _id: { $in: ids } },
          { $set: { isFeatured: true } }
        );
        return successResponse(
          { affected: result.modifiedCount },
          `${result.modifiedCount} medicines featured`
        );

      case 'unfeature':
        result = await Medicine.updateMany(
          { _id: { $in: ids } },
          { $set: { isFeatured: false } }
        );
        return successResponse(
          { affected: result.modifiedCount },
          `${result.modifiedCount} medicines unfeatured`
        );

      default:
        return errorResponse('Invalid action. Use: delete, activate, feature, unfeature', 400);
    }
  } catch (error) {
    return serverErrorResponse(error);
  }
}) as any;
