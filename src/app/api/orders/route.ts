import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import {
    successResponse,
    serverErrorResponse,
    validationErrorResponse,
} from '@/lib/api-response';
import { orderQuerySchema } from '@/lib/validations/order';

// =============================================================================
// GET /api/orders - List all orders (admin only)
// =============================================================================

export const GET = withAdmin(async (request, { user }) => {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        // Parse and validate query params
        const queryParams = {
            page: searchParams.get('page'),
            limit: searchParams.get('limit'),
            search: searchParams.get('search') || undefined,
            status: searchParams.get('status') || undefined,
            paymentStatus: searchParams.get('paymentStatus') || undefined,
            customerId: searchParams.get('customerId') || undefined,
            deliveryManId: searchParams.get('deliveryManId') || undefined,
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
            sortBy: searchParams.get('sortBy') || undefined,
            sortOrder: searchParams.get('sortOrder') || undefined,
        };

        const queryResult = orderQuerySchema.safeParse(queryParams);

        if (!queryResult.success) {
            let errorMessages: string[] = ['Invalid parameters'];
            // Handle unexpected Zod Error format (potentially due to version mismatch)
            if (queryResult.error && queryResult.error.issues) {
                errorMessages = queryResult.error.issues.map((e: any) => e.message);
            } else if (queryResult.error && Array.isArray((queryResult.error as any).errors)) {
                errorMessages = (queryResult.error as any).errors.map((e: any) => e.message);
            } else if (queryResult.error && typeof queryResult.error.message === 'string') {
                // Zod 4? or some other version might stringify the issues in message
                try {
                    const parsed = JSON.parse(queryResult.error.message);
                    if (Array.isArray(parsed)) {
                        errorMessages = parsed.map((e: any) => e.message);
                    } else {
                        errorMessages = [queryResult.error.message];
                    }
                } catch {
                    errorMessages = [queryResult.error.message];
                }
            }

            return validationErrorResponse(errorMessages);
        }

        const {
            page,
            limit,
            search,
            status,
            paymentStatus,
            customerId,
            deliveryManId,
            startDate,
            endDate,
            sortBy,
            sortOrder,
        } = queryResult.data;

        // Build query
        const query: any = {};

        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
            ];
        }

        if (status) {
            query.status = status;
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        if (customerId) {
            query.customer = customerId;
        }

        if (deliveryManId) {
            query.deliveryMan = deliveryManId;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        // Get total count
        const total = await Order.countDocuments(query);

        // Get paginated results
        const orders = await Order.find(query)
            .populate('customer', 'name email phone')
            .populate('deliveryMan', 'name email phone')
            .populate('items.medicine', 'name image')
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Get summary stats
        const [stats] = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0],
                        },
                    },
                    pendingOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
                    },
                    deliveredOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
                    },
                },
            },
        ]);

        return successResponse({
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
            stats: stats || {
                totalOrders: 0,
                totalRevenue: 0,
                pendingOrders: 0,
                deliveredOrders: 0,
            },
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
});
