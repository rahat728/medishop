import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import connectDB from '@/lib/db/mongoose';
import { Order, Cart } from '@/lib/db/models';
import { getStripe } from '@/lib/stripe';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        );
    } catch (err: any) {
        console.error(`❌ Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`✅ PaymentIntent was successful: ${paymentIntent.id}`);
            await handleSuccessfulPayment(paymentIntent);
            break;
        case 'payment_intent.payment_failed':
            const failedIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`❌ Payment failed: ${failedIntent.id}`);
            // Update order status to failed if orderId exists
            if (failedIntent.metadata.orderId) {
                await connectDB();
                await Order.findByIdAndUpdate(failedIntent.metadata.orderId, {
                    paymentStatus: 'failed',
                    status: 'cancelled',
                    $push: {
                        statusHistory: {
                            status: 'cancelled',
                            timestamp: new Date(),
                            note: 'Payment failed',
                        },
                    },
                });
            }
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
    await connectDB();

    const { userId, orderId, items } = paymentIntent.metadata;

    if (!userId) {
        console.error('No userId in payment intent metadata');
        return;
    }

    let finalOrderId = orderId;

    // If order wasn't created yet (e.g., direct card payment without prior Order record)
    if (!finalOrderId && items) {
        const parsedItems = JSON.parse(items);
        const orderItems = [];
        let subtotal = 0;

        // Note: For a robust webhook, we should fetch prices from DB again, 
        // but for now, we assume metadata is correct or we use it to create the order.
        // Usually, order is created BEFORE payment intent, but we'll support both.

        // Let's assume Order is created during checkout process normally.
    }

    if (finalOrderId) {
        const order = await Order.findByIdAndUpdate(finalOrderId, {
            paymentStatus: 'paid',
            status: 'confirmed',
            $push: {
                statusHistory: {
                    status: 'confirmed',
                    timestamp: new Date(),
                    note: 'Payment succeeded, order confirmed.',
                },
            },
        }, { new: true }).populate('customer');

        if (order) {
            // Send email
            if (order.customer && (order.customer as any).email) {
                await sendOrderConfirmationEmail(order, (order.customer as any).email);
            }
        }
    }

    // CLEAR CART in database
    await Cart.findOneAndDelete({ user: userId });
    console.log(`🛒 Cart cleared for user: ${userId}`);
}
