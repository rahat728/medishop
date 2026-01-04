import { Package, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import mongoose from 'mongoose';
import { Card, CardContent } from '@/components/ui';
import { requireDelivery } from '@/lib/auth';
import { DeliveryOrderCard } from '@/components/delivery/DeliveryOrderCard';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';

async function getStats(userId: string) {
  await connectDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const objectId = new mongoose.Types.ObjectId(userId);

  const [pending, active, deliveredToday] = await Promise.all([
    Order.countDocuments({ deliveryMan: objectId, status: 'assigned' }),
    Order.countDocuments({ deliveryMan: objectId, status: { $in: ['picked_up', 'on_the_way'] } }),
    Order.countDocuments({
      deliveryMan: objectId,
      status: 'delivered',
      updatedAt: { $gte: today }
    }),
  ]);

  return [
    { label: 'Assigned', value: pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Active', value: active, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Delivered Today', value: deliveredToday, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  ];
}

async function getOrders(userId: string) {
  await connectDB();
  const objectId = new mongoose.Types.ObjectId(userId);
  return await Order.find({
    deliveryMan: objectId,
    status: { $ne: 'delivered' }
  })
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 })
    .lean();
}

export default async function DeliveryOrdersPage() {
  const user = await requireDelivery();
  const stats = await getStats(user.id);
  const orders = await getOrders(user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your active and assigned deliveries</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Partner</p>
          <p className="text-sm font-bold text-primary-600">{user.name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-none shadow-sm overflow-hidden group">
              <CardContent className="p-4 relative">
                <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full ${stat.bg} opacity-20 group-hover:scale-110 transition-transform`} />
                <div className="relative">
                  <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-2`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Orders Section */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-bold text-gray-800">Assigned Deliveries</h2>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full">
            {orders.length}
          </span>
        </div>

        {orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order: any) => (
              <DeliveryOrderCard key={order._id} order={JSON.parse(JSON.stringify(order))} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-gray-50/50">
            <CardContent className="p-12 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Orders Assigned</h3>
              <p className="text-sm">New orders assigned by the admin will appear here.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Help/Notice */}
      <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex gap-4">
        <AlertCircle className="w-6 h-6 text-primary-600 shrink-0" />
        <div>
          <p className="text-sm font-bold text-primary-900">Safety Tip</p>
          <p className="text-xs text-primary-700 mt-1">
            Always wear your uniform and mask during deliveries. Confirm the patient's identity before handing over temperature-sensitive medicines.
          </p>
        </div>
      </div>
    </div>
  );
}
