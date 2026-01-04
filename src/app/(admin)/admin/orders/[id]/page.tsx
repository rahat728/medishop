import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Mail,
  Truck,
  Calendar,
  CreditCard,
  FileText,
} from 'lucide-react';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { AdminHeader } from '@/components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
  OrderStatusBadge,
  OrderTimeline,
  OrderItemsList,
} from '@/components/admin/orders';
import { OrderStatusSelectWrapper } from './OrderDetailClient';
import { OrderActionsClient } from './OrderActionsClient';
import { PAYMENT_STATUS_CONFIG, type PaymentStatus, type OrderStatus } from '@/lib/validations/order';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getOrder(id: string) {
  try {
    await connectDB();

    const order = await Order.findById(id)
      .populate('customer', 'name email phone address')
      .populate('deliveryMan', 'name email phone')
      .populate('items.medicine', 'name image price')
      .populate('statusHistory.updatedBy', 'name email')
      .lean();

    if (!order) return null;
    return JSON.parse(JSON.stringify(order));
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus as PaymentStatus];

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Order ${order.orderNumber}`}
        subtitle={`Placed on ${format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}`}
        actions={
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        }
      />

      {/* NEW: Edge-case actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderActionsClient
            orderId={order._id}
            status={order.status}
            paymentStatus={order.paymentStatus}
            paymentMethod={order.paymentMethod}
            paymentIntentId={order.paymentIntentId}
            totalAmount={order.totalAmount}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Status</CardTitle>
                <OrderStatusBadge status={order.status as OrderStatus} size="lg" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <OrderStatusSelectWrapper
                orderId={order._id}
                currentStatus={order.status as OrderStatus}
              />
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItemsList
                items={order.items}
                subtotal={order.subtotal}
                deliveryFee={order.deliveryFee}
                tax={order.tax}
                discount={order.discount}
                total={order.totalAmount}
              />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                history={order.statusHistory || []}
                currentStatus={order.status as OrderStatus}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">{order.customer?.name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                {order.customer?.email}
              </div>
              {order.customer?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {order.customer.phone}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <address className="not-italic text-sm text-gray-600 space-y-1">
                <p>{order.deliveryAddress?.street}</p>
                <p>
                  {order.deliveryAddress?.city}, {order.deliveryAddress?.state}{' '}
                  {order.deliveryAddress?.zipCode}
                </p>
              </address>
              {order.deliveryNotes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs font-medium text-yellow-800 mb-1">Delivery Notes</p>
                  <p className="text-sm text-yellow-700">{order.deliveryNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Man */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-gray-400" />
                Delivery Partner
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.deliveryMan ? (
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{order.deliveryMan.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {order.deliveryMan.phone || 'No phone'}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Truck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Not assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentConfig.bgColor} ${paymentConfig.color}`}>
                  {paymentConfig.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Method</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {order.paymentMethod}
                </span>
              </div>
              {order.paymentIntentId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">PaymentIntent</span>
                  <span className="text-xs font-mono text-gray-500">
                    {order.paymentIntentId.slice(0, 20)}...
                  </span>
                </div>
              )}
              {order.paidAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Paid on</span>
                  <span className="text-sm text-gray-900">
                    {format(new Date(order.paidAt), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
