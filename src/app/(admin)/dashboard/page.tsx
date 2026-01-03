import { Suspense } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  DollarSign,
  Package,
  Truck,
  TrendingUp,
  ArrowRight,
  Boxes,
} from 'lucide-react';
import connectDB from '@/lib/db/mongoose';
import { Medicine, Order, User } from '@/lib/db/models';
import { AdminHeader } from '@/components/layout';
import {
  StatsCard,
  StatsGrid,
  SimpleBarChart,
  DonutChart,
  RecentOrdersWidget,
  LowStockWidget,
  ActivityFeedWidget,
} from '@/components/admin';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';

// =============================================================================
// Data Fetching
// =============================================================================

async function getDashboardData() {
  try {
    await connectDB();

    // Get counts
    const [
      totalOrders,
      totalMedicines,
      totalDeliveryMen,
      outOfStockCount,
      lowStockMedicines,
    ] = await Promise.all([
      Order.countDocuments(),
      Medicine.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'delivery', isActive: true }),
      Medicine.countDocuments({ isActive: true, stock: 0 }),
      Medicine.find({
        isActive: true,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      })
        .select('name stock lowStockThreshold image manufacturer')
        .sort({ stock: 1 })
        .limit(5)
        .lean(),
    ]);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, revenueResult] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('customer', 'name')
      .select('orderNumber totalAmount status createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get orders by status for donut chart
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      stats: {
        totalOrders,
        todayOrders,
        totalRevenue,
        totalMedicines,
        totalDeliveryMen,
        outOfStockCount,
      },
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
      lowStockMedicines: JSON.parse(JSON.stringify(lowStockMedicines)),
      ordersByStatus,
    };
  } catch (error) {
    console.error('Dashboard data error:', error);
    return {
      stats: {
        totalOrders: 0,
        todayOrders: 0,
        totalRevenue: 0,
        totalMedicines: 0,
        totalDeliveryMen: 0,
        outOfStockCount: 0,
      },
      recentOrders: [],
      lowStockMedicines: [],
      ordersByStatus: [],
    };
  }
}

// =============================================================================
// Page Component
// =============================================================================

export default async function AdminDashboardPage() {
  const { stats, recentOrders, lowStockMedicines, ordersByStatus } = await getDashboardData();

  // Format orders for widget
  const formattedOrders = recentOrders.map((order: any) => ({
    _id: order._id.toString(),
    orderNumber: order.orderNumber,
    customer: { name: order.customer?.name || 'Unknown' },
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
  }));

  // Format low stock for widget
  const formattedLowStock = lowStockMedicines.map((med: any) => ({
    _id: med._id.toString(),
    name: med.name,
    stock: med.stock,
    lowStockThreshold: med.lowStockThreshold,
    image: med.image,
  }));

  // Prepare donut chart data
  const statusColors: Record<string, string> = {
    delivered: '#22c55e',
    on_the_way: '#06b6d4',
    confirmed: '#3b82f6',
    pending: '#eab308',
    cancelled: '#ef4444',
  };

  const donutData = ordersByStatus.map((item: any) => ({
    label: item._id.charAt(0).toUpperCase() + item._id.slice(1).replace('_', ' '),
    value: item.count,
    color: statusColors[item._id] || '#9ca3af',
  }));

  // Mock weekly data (in real app, fetch from DB)
  const weeklyOrders = [
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 18 },
    { label: 'Wed', value: 15 },
    { label: 'Thu', value: 22 },
    { label: 'Fri', value: 28 },
    { label: 'Sat', value: 35 },
    { label: 'Sun', value: 20 },
  ];

  // Mock activities
  const activities = [
    { id: '1', type: 'order_placed' as const, message: 'New order received', time: '5 min ago' },
    { id: '2', type: 'order_delivered' as const, message: 'Order delivered', time: '1 hour ago' },
    { id: '3', type: 'low_stock' as const, message: 'Low stock alert triggered', time: '2 hours ago' },
  ];

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your store today."
      />

      {/* Stats Grid */}
      <StatsGrid columns={4}>
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          change={stats.todayOrders}
          changeLabel="today"
          icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Products"
          value={stats.totalMedicines}
          icon={<Package className="w-6 h-6 text-purple-600" />}
          iconBgColor="bg-purple-100"
        />
        <Link href="/stock" className="block">
          <StatsCard
            title="Stock Alerts"
            value={stats.outOfStockCount + formattedLowStock.length}
            icon={<Boxes className={`w-6 h-6 ${stats.outOfStockCount > 0 ? 'text-red-600' : 'text-yellow-600'}`} />}
            iconBgColor={stats.outOfStockCount > 0 ? 'bg-red-100' : 'bg-yellow-100'}
          />
        </Link>
      </StatsGrid>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Orders Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              Weekly Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={weeklyOrders} height={220} />
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {donutData.length > 0 ? (
              <DonutChart
                data={donutData}
                size={180}
                centerValue={stats.totalOrders.toString()}
                centerLabel="Total"
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No order data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentOrdersWidget orders={formattedOrders} />
        <LowStockWidget medicines={formattedLowStock} />
        <ActivityFeedWidget activities={activities} />
      </div>
    </div>
  );
}
