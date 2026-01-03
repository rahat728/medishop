import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Order, Medicine } from '@/lib/db/models';
import { withAdmin, withAuth } from '@/lib/auth';
import {
    successResponse,
    errorResponse,
    serverErrorResponse,
    validationErrorResponse,
} from '@/lib/api-response';
import { orderQuerySchema, createOrderSchema } from '@/lib/validations/order';

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
            if (queryResult.error && queryResult.error.issues) {
                errorMessages = queryResult.error.issues.map((e: any) => e.message);
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

        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (customerId) query.customer = customerId;
        if (deliveryManId) query.deliveryMan = deliveryManId;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
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

// =============================================================================
// POST /api/orders - Create new order (authenticated customer)
// =============================================================================

export const POST = withAuth(async (request, { user }) => {
    try {
        await connectDB();

        const body = await request.json();

        // Validate request body
        const validation = createOrderSchema.safeParse(body);
        if (!validation.success) {
            return validationErrorResponse(
                validation.error.issues.map((e: any) => e.message)
            );
        }

        const { items, shippingAddress, paymentMethod, notes } = validation.data;

        // Verify stock and calculate total
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const medicine = await Medicine.findById(item.medicine);

            if (!medicine) {
                return errorResponse(`Medicine not found: ${item.medicine}`, 404);
            }

            if (!medicine.isActive) {
                return errorResponse(`${medicine.name} is no longer available`, 400);
            }

            if (medicine.stock < item.quantity) {
                return errorResponse(
                    `Insufficient stock for ${medicine.name}. Only ${medicine.stock} available.`,
                    400
                );
            }

            const itemTotal = medicine.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                medicine: medicine._id,
                name: medicine.name,
                price: medicine.price,
                quantity: item.quantity,
                subtotal: itemTotal,
            });

            // Reserve stock (decrement)
            medicine.stock -= item.quantity;
            await medicine.save();
        }

        // Calculate totals
        const deliveryFee = subtotal > 50 ? 0 : 5.99;
        const tax = subtotal * 0.08;
        const totalAmount = subtotal + deliveryFee + tax;

        // Generate order number explicitly
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const orderNumber = `ORD-${dateStr}-${random}`;

        // Create order
        const order = await Order.create({
            orderNumber,
            customer: user.id,
            items: orderItems,
            subtotal,
            deliveryFee,
            tax,
            totalAmount,
            deliveryAddress: shippingAddress,
            paymentMethod,
            paymentStatus: 'pending',
            status: 'pending',
            statusHistory: [
                {
                    status: 'pending',
                    timestamp: new Date(),
                    note: 'Order placed successfully',
                },
            ],
            notes,
        });

        return successResponse(order, 'Order created successfully', 201);
    } catch (error) {
        return serverErrorResponse(error);
    }
});
