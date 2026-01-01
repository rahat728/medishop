import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { User } from '@/lib/db/models';

export async function GET() {
    try {
        await connectDB();
        const users = await User.find({}).select('+password');

        return NextResponse.json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch users',
            },
            { status: 500 }
        );
    }
}
