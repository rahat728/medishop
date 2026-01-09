import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe() {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error('STRIPE_SECRET_KEY is missing');
        }
        stripeInstance = new Stripe(key, {
            apiVersion: '2025-12-15.clover',
            typescript: true,
        });
    }
    return stripeInstance;
}
