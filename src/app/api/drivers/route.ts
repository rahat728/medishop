import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { User } from '@/lib/db/models';
import { withAuth, withDelivery } from '@/lib/auth';
import { successResponse, serverErrorResponse, notFoundResponse } from '@/lib/api-response';

// =============================================================================
// GET /api/drivers - Get current driver info
// =============================================================================

export const GET = withAuth(async (request, { user }) => {
  try {
    await connectDB();

    if (user.role !== 'delivery') {
      return serverErrorResponse(new Error('Unauthorized'), 403);
    }

    const driver = await User.findById(user.id)
      .select('name phone email isActive currentLocation')
      .lean();

    if (!driver) {
      return notFoundResponse('Driver not found');
    }

    return successResponse({
      driver: {
        _id: driver._id.toString(),
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        isActive: driver.isActive,
        currentLocation: driver.currentLocation,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
});
