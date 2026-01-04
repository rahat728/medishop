import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        await connectDB();

        // 1. Check if ID is valid
        const isValid = mongoose.Types.ObjectId.isValid(id);

        // 2. Fetch raw order
        let rawOrder = null;
        if (isValid) {
            rawOrder = await Order.findById(id).lean();
        }

        // 3. Find with populate
        let populatedOrder = null;
        if (isValid) {
            populatedOrder = await Order.findById(id)
                .populate('deliveryMan', 'name email')
                .lean();
        }

        return NextResponse.json({
            debug: {
                requestedId: id,
                isValidObjectId: isValid,
                exists: !!rawOrder,
                rawDeliveryMan: rawOrder?.deliveryMan,
                populatedDeliveryMan: populatedOrder?.deliveryMan,
                status: rawOrder?.status
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
