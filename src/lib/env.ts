import { z } from 'zod';

const envSchema = z.object({
    // Database
    MONGODB_URI: z.string().url(),

    // Auth
    NEXTAUTH_SECRET: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.string().min(1)), // Support localhost

    // Stripe
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),

    // Email
    EMAIL_HOST: z.string().min(1),
    EMAIL_PORT: z.string().transform((v) => parseInt(v, 10)),
    EMAIL_USER: z.string().min(1),
    EMAIL_PASS: z.string().min(1),
    EMAIL_FROM: z.string().email(),

    // App Metadata
    NEXT_PUBLIC_APP_NAME: z.string().default('Medishop'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const envServer = envSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NODE_ENV: process.env.NODE_ENV,
});

if (!envServer.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(envServer.error.format(), null, 2));
    throw new Error('Invalid environment variables. Check your .env file or Vercel dashboard.');
}

export const env = envServer.data;
