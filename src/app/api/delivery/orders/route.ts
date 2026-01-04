import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withDelivery } from '@/lib/auth';
import { successResponse, serverErrorResponse } from '@/lib/api-response';

export const GET = withDelivery(async (request: NextRequest, { user }) => {
    try {
        await connectDB();

        const searchParams = request.nextUrl.searchParams;
        const statusParam = searchParams.get('status');

        let query: any = { deliveryMan: user.id };

        if (statusParam === 'active') {
            query.status = { $in: ['picked_up', 'on_the_way'] };
        } else if (statusParam) {
            query.status = statusParam;
        }

        const orders = await Order.find(query)
            .populate('customer', 'name phone email')
            .sort({ updatedAt: -1, createdAt: -1 })
            .lean();

        return successResponse({ orders });
    } catch (error) {
        return serverErrorResponse(error);
    }
});
