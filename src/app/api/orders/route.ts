import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Order, Medicine, User } from '@/lib/db/models';
import { withAdmin, withAuth } from '@/lib/auth';
import { sendOrderConfirmationEmail, sendOrderDeliveredEmail, sendOrderCancelledEmail } from '@/lib/email';
import {
    successResponse,
    errorResponse,
    serverErrorResponse,
    validationErrorResponse,
} from '@/lib/api-response';
import { orderQuerySchema, createOrderSchema } from '@/lib/validations/order';

// =============================================================================
// GET /api/orders - List orders (admin or delivery)
// =============================================================================

export const GET = withAuth(async (request, { user }) => {
    try {
        await connectDB();

        const isAdmin = user.role === 'admin';
        const isDelivery = user.role === 'delivery';

        if (!isAdmin && !isDelivery) {
            return errorResponse('Insufficient permissions', 403);
        }

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
            type: searchParams.get('type') || undefined,
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
            type,
        } = queryResult.data;

        // Build query
        const query: any = {};

        if (search) {
            // Find users matching search in name or email
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);

            // Find medicines matching search
            const medicines = await Medicine.find({
                name: { $regex: search, $options: 'i' }
            }).select('_id');
            const medicineIds = medicines.map(m => m._id);

            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { customer: { $in: userIds } },
                { 'items.medicine': { $in: medicineIds } },
                { 'items.name': { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (customerId) query.customer = customerId;

        // Force delivery person to only see their orders
        if (isDelivery) {
            query.deliveryMan = user.id;
        } else if (deliveryManId) {
            if (deliveryManId) query.deliveryMan = deliveryManId;
        }

        if (type === 'logistics') {
            query.status = { $in: ['assigned', 'picked_up', 'on_the_way'] };
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const total = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .populate('customer', 'name email phone')
            .populate('deliveryMan', 'name email phone')
            .populate('items.medicine', 'name image')
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Calculate stats only for admin
        let stats = null;
        if (isAdmin) {
            const allOrders = await Order.find(query).select('totalAmount status');
            stats = {
                totalOrders: total,
                totalRevenue: allOrders.reduce((sum, order) => sum + order.totalAmount, 0),
                pendingOrders: allOrders.filter(order => order.status === 'pending').length,
                deliveredOrders: allOrders.filter(order => order.status === 'delivered').length,
            };
        }

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
            stats,
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

        if (!items || !Array.isArray(items) || items.length === 0) {
            return errorResponse('Order must have at least one item', 400);
        }

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
                    `Insufficient stock for ${medicine.name}. Only ${medicine.stock} available`,
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

            // Reserve stock
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
                    note: 'Order placed',
                },
            ],
            notes,
        });

        // Populate customer to get email for confirmation
        const populatedOrder = await Order.findById(order._id).populate('customer');

        // Send confirmation email
        if (populatedOrder && populatedOrder.customer && (populatedOrder.customer as any).email) {
            await sendOrderConfirmationEmail(populatedOrder, (populatedOrder.customer as any).email);
        }

        return successResponse(order, 'Order created successfully', 201);
    } catch (error) {
        console.error('ORDER_POST_ERROR:', error);
        return serverErrorResponse(error);
    }
});

