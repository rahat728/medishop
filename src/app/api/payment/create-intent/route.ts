import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { withAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import { Cart, Medicine, Order } from '@/lib/db/models';
import { successResponse, serverErrorResponse, errorResponse } from '@/lib/api-response';
import { IMedicine } from '@/lib/db/models/Medicine';

// =============================================================================
// POST /api/payment/create-intent
// =============================================================================

export const POST = withAuth(async (request, { user }) => {
    try {
        await connectDB();

        const body = await request.json();
        let items = body.items;
        const { shippingAddress, notes } = body;

        // If no items in body, try to get from DB cart (fallback)
        if (!items || !Array.isArray(items) || items.length === 0) {
            const cart = await Cart.findOne({ user: user.id }).populate('items.medicine');
            if (cart && cart.items.length > 0) {
                items = cart.items.map((item: any) => ({
                    medicine: item.medicine._id || item.medicine,
                    quantity: item.quantity
                }));
            }
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return errorResponse('Cart is empty', 400);
        }

        if (!shippingAddress) {
            return errorResponse('Shipping address is required', 400);
        }

        // Calculate total securely using DB prices
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const medicineId = item.medicine;
            const medicine = await Medicine.findById(medicineId) as IMedicine;

            if (medicine && medicine.isActive) {
                if (medicine.stock < item.quantity) {
                    return errorResponse(`Insufficient stock for ${medicine.name}`, 400);
                }
                const itemTotal = medicine.price * item.quantity;
                subtotal += itemTotal;

                orderItems.push({
                    medicine: medicine._id,
                    name: medicine.name,
                    price: medicine.price,
                    quantity: item.quantity,
                    subtotal: itemTotal
                });
            }
        }

        if (subtotal === 0) {
            return errorResponse('Valid items not found or cart is empty', 400);
        }

        // Logic: subtotal > 50 -> free delivery, else 5.99. Tax: 8%
        const deliveryFee = subtotal > 50 ? 0 : 5.99;
        const tax = subtotal * 0.08;
        const totalAmount = subtotal + deliveryFee + tax;

        // Generate order number explicitly
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const orderNumber = `ORD-${dateStr}-${random}`;

        // Create Order record (pending payment)
        const order = await Order.create({
            orderNumber,
            customer: user.id,
            items: orderItems,
            subtotal,
            deliveryFee,
            tax,
            totalAmount,
            deliveryAddress: shippingAddress,
            paymentMethod: 'stripe',
            paymentStatus: 'pending',
            status: 'pending',
            statusHistory: [
                {
                    status: 'pending',
                    timestamp: new Date(),
                    note: 'Awaiting card payment confirmation',
                },
            ],
            notes,
        });

        // Convert to cents for Stripe
        const amountInCents = Math.round(totalAmount * 100);

        // 2. Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: user.id.toString(),
                orderId: order._id.toString(),
                items: JSON.stringify(items.map((i: any) => ({
                    m: i.medicine.toString(),
                    q: i.quantity
                })))
            },
        });

        // Update Order with paymentIntentId
        order.paymentIntentId = paymentIntent.id;
        await order.save();

        return successResponse({
            clientSecret: paymentIntent.client_secret,
            amount: totalAmount,
            orderId: order._id,
        }, 'Payment intent created');
    } catch (error) {
        console.error('STRIPE_ERROR:', error);
        return serverErrorResponse(error);
    }
});
