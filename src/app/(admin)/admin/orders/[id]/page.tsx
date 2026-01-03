import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { OrderDetailClient } from './OrderDetailClient';

interface Props {
    params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
    title: 'Order Details | MedDelivery Admin',
    description: 'View order details',
};

async function getOrder(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    await connectDB();
    const order = await Order.findById(id)
        .populate('customer', 'name email phone')
        .populate('deliveryMan', 'name email phone')
        .populate('items.medicine', 'name image price')
        .lean();

    if (!order) {
        return null;
    }

    // Serialize MongoDB object
    return JSON.parse(JSON.stringify(order));
}

export default async function OrderDetailPage({ params }: Props) {
    const { id } = await params;
    const order = await getOrder(id);

    if (!order) {
        notFound();
    }

    return <OrderDetailClient order={order} />;
}
