import NextAuth from 'next-auth'; // Re-trigger build
import { authOptions } from '@/lib/auth/options';
import { rateLimit } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

const handler = NextAuth(authOptions);

export async function GET(req: any, res: any) {
    return handler(req, res);
}

export async function POST(req: any, res: any) {
    // Rate limit login attempts: 5 per minute per IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const limitResult = await rateLimit(`login-${ip}`, { limit: 5, windowMs: 60000 });

    if (!limitResult.success) {
        return NextResponse.json({ error: 'Too many login attempts. Please try again in a minute.' }, { status: 429 });
    }

    return handler(req, res);
}
