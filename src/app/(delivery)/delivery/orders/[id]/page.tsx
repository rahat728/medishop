import mongoose from 'mongoose';
import { notFound } from 'next/navigation';
import {
    ArrowLeft,
    MapPin,
    Phone,
    User,
    Package,
    CreditCard,
    CheckCircle2,
    Truck,
    Navigation,
    Clock,
    ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { requireDelivery } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { OrderStatusBadge } from '@/components/admin/orders';
import { format } from 'date-fns';
import { DeliveryActions } from './DeliveryActions';

async function getOrder(id: string, deliveryManId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    await connectDB();
    const order = await Order.findById(id)
        .populate('customer', 'name email phone')
        .populate('items.medicine', 'name image price unit')
        .lean();

    if (!order) {
        return null;
    }

    // Verify ownership
    const assignedManId = (order.deliveryMan as any)?._id?.toString() || order.deliveryMan?.toString();

    if (assignedManId !== deliveryManId) {
        return null;
    }

    return order;
}

// function removed

export default async function DeliveryOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await requireDelivery();
    const order: any = await getOrder(id, user.id);

    if (!order || order.error) {
        return (
            <div className="p-8 text-center text-red-600">
                <h1 className="text-2xl font-bold mb-4">Error: {order?.error || 'Order Not Found'}</h1>
                <pre className="bg-gray-100 p-4 rounded text-left text-xs overflow-auto">
                    {JSON.stringify(order?.debug, null, 2)}
                </pre>
                <div className="mt-4 text-xs text-gray-500">
                    User: {user.id}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link
                    href="/my-orders"
                    className="flex items-center text-sm font-bold text-gray-400 hover:text-primary-600 transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            Order {order.orderNumber}
                        </h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">
                            Assigned on {format(new Date(order.updatedAt), 'MMM d, h:mm a')}
                        </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Column */}
                <div className="space-y-6">
                    {/* Action Cards */}
                    <Card className="border-none bg-primary-600 text-white shadow-xl shadow-primary-200">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Navigation className="w-5 h-5" />
                                Delivery Status
                            </h3>
                            <DeliveryActions orderId={order._id.toString()} currentStatus={order.status} />
                        </CardContent>
                    </Card>

                    {/* Customer Info */}
                    <Card className="p-6 border-none bg-white shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-primary-500" />
                            Customer Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-black text-gray-900">{order.customer?.name}</p>
                                <div className="flex items-center gap-2 text-primary-600 mt-1">
                                    <Phone className="w-4 h-4" />
                                    <p className="text-sm font-bold">{order.customer?.phone}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Delivery Address</p>
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                        {order.deliveryAddress.street}<br />
                                        {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Items & Payment Column */}
                <div className="space-y-6">
                    {/* Items */}
                    <Card className="p-6 border-none bg-white shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4 text-primary-500" />
                            Order Items
                        </h3>
                        <div className="space-y-4">
                            {order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <div className="flex gap-3">
                                        <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-600">
                                            {item.quantity}
                                        </div>
                                        <p className="font-medium text-gray-700">{item.medicine?.name}</p>
                                    </div>
                                    <p className="text-gray-400 font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                            <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 -mx-6 px-6 py-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Collect total</p>
                                <p className="text-xl font-black text-primary-600">${order.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Payment */}
                    <Card className="p-6 border-none bg-white shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-primary-500" />
                            Payment info
                        </h3>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-bold text-gray-900 capitalize">
                                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid via Card'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {order.paymentStatus === 'paid' ? 'Transaction complete' : 'Collect cash from customer'}
                                </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {order.paymentStatus}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Note Section */}
            {order.notes && (
                <Card className="bg-yellow-50 border-yellow-100 border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex gap-4">
                            <ShieldCheck className="w-6 h-6 text-yellow-600 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-yellow-800 uppercase tracking-widest mb-1">Customer Notes</p>
                                <p className="text-sm text-yellow-900 font-medium italic">"{order.notes}"</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
