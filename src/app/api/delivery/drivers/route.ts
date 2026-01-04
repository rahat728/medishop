import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { User } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import {
    successResponse,
    serverErrorResponse,
} from '@/lib/api-response';

/**
 * GET /api/delivery/drivers
 * Fetch all delivery partners (Admin only)
 */
export const GET = withAdmin(async () => {
    try {
        await connectDB();

        const drivers = await User.find({ role: 'delivery', isActive: true })
            .select('name email phone address')
            .lean();

        return successResponse(drivers, 'Drivers fetched successfully');
    } catch (error) {
        console.error('FETCH_DRIVERS_ERROR:', error);
        return serverErrorResponse(error);
    }
});
