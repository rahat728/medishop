import Link from 'next/link';
import { Package, Truck, CheckCircle, Clock, ChevronRight, MapPin } from 'lucide-react';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { requireCustomer } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';

async function getOrders(userId: string) {
  await connectDB();
  // Fetch orders for this customer
  const orders = await Order.find({ customer: userId })
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(orders));
}

export default async function CustomerOrdersPage() {
  console.log('📦 [CustomerOrdersPage] Rendering');
  const user = await requireCustomer();
  const orders = await getOrders(user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-2">Track and manage your medical deliveries</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-500 mb-6">
              You haven't placed any orders yet. Start shopping for medicines!
            </p>
            <Link href="/medicines">
              <Button>Browse Medicines</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order: any) => {
            const isLive = ['picked_up', 'on_the_way'].includes(order.status);

            return (
              <Card key={order._id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-medium text-gray-900">
                            {order.orderNumber}
                          </span>
                          <Badge
                            variant={
                              order.status === 'delivered' ? 'success' :
                                order.status === 'cancelled' ? 'error' :
                                  isLive ? 'info' : 'default'
                            }
                            className="capitalize"
                          >
                            {String(order.status).replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          Ordered on {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {isLive && (
                        <Link href={`/track/${order._id}`}>
                          <Button size="sm" className="w-full sm:w-auto gap-2">
                            <MapPin className="w-4 h-4" />
                            Track Order
                          </Button>
                        </Link>
                      )}
                    </div>

                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                      <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Delivery Address</p>
                        <p className="text-sm text-gray-600">
                          {order.deliveryAddress?.street}, {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
