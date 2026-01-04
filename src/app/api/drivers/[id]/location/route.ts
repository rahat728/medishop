import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { User } from '@/lib/db/models';
import { withAuth, withDelivery } from '@/lib/auth';
import { getIO } from '@/lib/socket/server';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response';

// =============================================================================
// PUT /api/drivers/[id]/location - Update driver location
// =============================================================================

export const PUT = withDelivery(async (request, { user, params }) => {
  try {
    await connectDB();

    const id = params?.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid driver ID', 400);
    }

    const { latitude, longitude } = await request.json();

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return errorResponse('Invalid coordinates', 400);
    }

    // Update driver's current location in DB
    const driver = await User.findByIdAndUpdate(
      id,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        lastLocationUpdate: new Date(),
      },
      { new: true }
    );

    if (!driver) {
      return errorResponse('Driver not found', 404);
    }

    // Emit location update via Socket.io to connected clients
    const io = getIO();
    if (io) {
      io.emit('driver:location', {
        driverId: driver._id.toString(),
        name: driver.name,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      });
    }

    return successResponse({
      message: 'Location updated',
      location: driver.currentLocation,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
});
