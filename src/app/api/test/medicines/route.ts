import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';

export async function GET() {
    try {
        await connectDB();
        const medicines = await Medicine.find({}).limit(10);

        return NextResponse.json({
            success: true,
            count: medicines.length,
            data: medicines,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch medicines',
            },
            { status: 500 }
        );
    }
}
