import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { withAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import { Cart } from '@/lib/db/models';
import { successResponse, serverErrorResponse, errorResponse } from '@/lib/api-response';
import { IMedicine } from '@/lib/db/models/Medicine';

// =============================================================================
// POST /api/payment/create-intent
// =============================================================================

export const POST = withAuth(async (request, { user }) => {
    try {
        await connectDB();

        // 1. Get cart total from DB to prevent client-side manipulation
        const cart = await Cart.findOne({ user: user.id }).populate('items.medicine');

        if (!cart || cart.items.length === 0) {
            return errorResponse('Cart is empty', 400);
        }

        // Calculate total
        let subtotal = 0;
        for (const item of cart.items) {
            const medicine = item.medicine as unknown as IMedicine;
            if (medicine && medicine.price) {
                subtotal += medicine.price * item.quantity;
            }
        }

        // Logic: subtotal > 50 -> free delivery, else 5.99. Tax: 8%
        const deliveryFee = subtotal > 50 ? 0 : 5.99;
        const tax = subtotal * 0.08;
        const totalAmount = subtotal + deliveryFee + tax;

        // Convert to cents for Stripe (e.g. $10.99 -> 1099)
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
                cartId: cart._id.toString(),
            },
        });

        return successResponse({
            clientSecret: paymentIntent.client_secret,
            amount: totalAmount,
        }, 'Payment intent created');
    } catch (error) {
        console.error('STRIIPE_ERROR:', error);
        return serverErrorResponse(error);
    }
});
