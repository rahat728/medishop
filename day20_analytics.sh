#!/bin/bash

#==============================================================================
# 🏥 MedDelivery MVP - Day 20: Analytics
# Revenue summary, orders analytics, simple charts (real DB data)
#==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() {
  echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}🔹 $1${NC}"
  echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

show_banner() {
  clear
  echo -e "${CYAN}"
  cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🏥 MedDelivery MVP - Day 20: Analytics                    ║
║                                                              ║
║     Today: Orders + Revenue summary + charts (real DB data)   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
  echo -e "${NC}"
}

#==============================================================================
# PHASE 1: Verify Project
#==============================================================================

verify_project() {
  log_step "Phase 1: Verifying Project Setup"

  if [ ! -f "package.json" ]; then
    log_error "package.json not found!"
    read -p "Enter project directory path: " PROJECT_PATH
    if [ -d "$PROJECT_PATH" ]; then
      cd "$PROJECT_PATH"
      log_success "Changed to $PROJECT_PATH"
    else
      log_error "Directory not found."
      exit 1
    fi
  fi

  if [ ! -f "src/lib/db/models/Order.ts" ] || [ ! -f "src/lib/db/models/Medicine.ts" ]; then
    log_error "DB models not found. Run Day 2."
    exit 1
  fi

  if [ ! -f "src/components/admin/SimpleLineChart.tsx" ]; then
    log_error "Admin chart components not found. Run Day 5."
    exit 1
  fi

  if [ ! -f "src/lib/auth/api-auth.ts" ]; then
    log_error "API auth helpers not found. Run Day 4."
    exit 1
  fi

  log_success "Project verified!"
}

#==============================================================================
# PHASE 2: Create Admin Analytics API
#==============================================================================

create_admin_analytics_api() {
  log_step "Phase 2: Creating Admin Analytics API"

  mkdir -p src/app/api/admin/analytics/overview

  cat > src/app/api/admin/analytics/overview/route.ts << 'EOF'
import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response';

function getStartDate(period: string) {
  const now = new Date();
  const msDay = 24 * 60 * 60 * 1000;

  switch (period) {
    case '30d':
      return new Date(now.getTime() - 30 * msDay);
    case '90d':
      return new Date(now.getTime() - 90 * msDay);
    case '7d':
    default:
      return new Date(now.getTime() - 7 * msDay);
  }
}

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    if (!['7d', '30d', '90d'].includes(period)) {
      return errorResponse('Invalid period. Use 7d, 30d, 90d.', 400);
    }

    const startDate = getStartDate(period);
    const endDate = new Date();

    // Summary
    const [summary] = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] },
          },
          avgOrderValue: {
            $avg: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', null] },
          },
          deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        },
      },
    ]);

    // Orders & revenue by day (paid revenue)
    const byDay = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // By status
    const byStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Top products (snapshot name)
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]);

    // Top categories (lookup Medicine by items.medicine)
    const topCategories = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'medicines',
          localField: 'items.medicine',
          foreignField: '_id',
          as: 'medicineDoc',
        },
      },
      { $unwind: { path: '$medicineDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$medicineDoc.category', 'Unknown'] },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]);

    return successResponse({
      period,
      range: { startDate, endDate },
      summary: summary || {
        totalOrders: 0,
        paidOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
      },
      byDay,
      byStatus,
      topProducts,
      topCategories,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
});
EOF

  log_success "Admin analytics API created!"
}

#==============================================================================
# PHASE 3: Create Analytics UI Components
#==============================================================================

create_analytics_components() {
  log_step "Phase 3: Creating Analytics Components"

  mkdir -p src/components/admin/analytics

  cat > src/components/admin/analytics/AnalyticsDashboard.tsx << 'EOF'
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { BarChart3, DollarSign, ShoppingBag, Percent, RefreshCw, Package } from 'lucide-react';
import { AdminHeader } from '@/components/layout';
import { StatsCard, StatsGrid, SimpleLineChart, SimpleBarChart, DonutChart } from '@/components/admin';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';

type Period = '7d' | '30d' | '90d';

interface AnalyticsResponse {
  period: Period;
  summary: {
    totalOrders: number;
    paidOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  byDay: Array<{ _id: string; orders: number; revenue: number }>;
  byStatus: Array<{ _id: string; count: number }>;
  topProducts: Array<{ _id: string; quantity: number; revenue: number }>;
  topCategories: Array<{ _id: string; quantity: number; revenue: number }>;
}

const statusColors: Record<string, string> = {
  pending: '#eab308',
  confirmed: '#3b82f6',
  assigned: '#8b5cf6',
  picked_up: '#f97316',
  on_the_way: '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

function labelDay(dateStr: string) {
  // YYYY-MM-DD -> MM/DD
  const mm = dateStr.slice(5, 7);
  const dd = dateStr.slice(8, 10);
  return `${mm}/${dd}`;
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>('7d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/overview?period=${period}`, { cache: 'no-store' as any });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load analytics');
      setData(json.data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const revenueSeries = useMemo(() => {
    const rows = data?.byDay || [];
    return rows.map((r) => ({ label: labelDay(r._id), value: Math.round(r.revenue) }));
  }, [data]);

  const ordersSeries = useMemo(() => {
    const rows = data?.byDay || [];
    return rows.map((r) => ({ label: labelDay(r._id), value: r.orders }));
  }, [data]);

  const statusDonut = useMemo(() => {
    const rows = data?.byStatus || [];
    return rows.map((r) => ({
      label: String(r._id).replace('_', ' '),
      value: r.count,
      color: statusColors[String(r._id)] || '#9ca3af',
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Analytics"
        subtitle="Track orders and revenue performance"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button
              variant="secondary"
              onClick={fetchData}
              leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <StatsGrid columns={4}>
        <StatsCard
          title="Total Orders"
          value={loading ? '—' : (data?.summary.totalOrders ?? 0)}
          icon={ShoppingBag}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          loading={loading}
        />
        <StatsCard
          title="Revenue"
          value={loading ? '—' : `$${(data?.summary.totalRevenue ?? 0).toLocaleString()}`}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          loading={loading}
        />
        <StatsCard
          title="Avg Order"
          value={loading ? '—' : `$${Math.round(data?.summary.avgOrderValue ?? 0).toLocaleString()}`}
          icon={Percent}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          loading={loading}
        />
        <StatsCard
          title="Delivered"
          value={loading ? '—' : (data?.summary.deliveredOrders ?? 0)}
          icon={BarChart3}
          iconColor="text-cyan-600"
          iconBgColor="bg-cyan-100"
          loading={loading}
        />
      </StatsGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] bg-gray-50 rounded-lg animate-pulse" />
            ) : (
              <SimpleLineChart data={revenueSeries} height={260} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {loading ? (
              <div className="h-[260px] w-full bg-gray-50 rounded-lg animate-pulse" />
            ) : statusDonut.length ? (
              <DonutChart
                data={statusDonut}
                size={200}
                centerValue={String(data?.summary.totalOrders ?? 0)}
                centerLabel="Orders"
              />
            ) : (
              <div className="text-gray-600">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gray-400" />
            Orders per Day
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[220px] bg-gray-50 rounded-lg animate-pulse" />
          ) : (
            <SimpleBarChart data={ordersSeries} height={220} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.topCategories || []).length === 0 ? (
                  <div className="text-gray-600">No category data yet.</div>
                ) : (
                  data!.topCategories.map((c) => (
                    <div key={c._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{c._id}</div>
                        <div className="text-xs text-gray-500">{c.quantity} units</div>
                      </div>
                      <div className="font-semibold text-gray-900">${Math.round(c.revenue).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.topProducts || []).length === 0 ? (
                  <div className="text-gray-600">No product data yet.</div>
                ) : (
                  data!.topProducts.map((p) => (
                    <div key={p._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{p._id}</div>
                        <div className="text-xs text-gray-500">{p.quantity} units</div>
                      </div>
                      <div className="font-semibold text-gray-900">${Math.round(p.revenue).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!loading && data && (
        <div className="text-xs text-gray-500">
          Period: <span className="font-medium">{data.period}</span>. Revenue counts only <span className="font-medium">paid</span> orders.
        </div>
      )}
    </div>
  );
}
EOF

  cat > src/components/admin/analytics/index.ts << 'EOF'
export { AnalyticsDashboard } from './AnalyticsDashboard';
EOF

  log_success "Analytics components created!"
}

#==============================================================================
# PHASE 4: Create Analytics Page
#==============================================================================

create_analytics_page() {
  log_step "Phase 4: Creating /analytics admin page"

  mkdir -p "src/app/(admin)/analytics"

  cat > "src/app/(admin)/analytics/page.tsx" << 'EOF'
import { AnalyticsDashboard } from '@/components/admin/analytics';

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
EOF

  log_success "Analytics page created!"
}

#==============================================================================
# PHASE 5: Update AdminSidebar to include Analytics
#==============================================================================

update_admin_sidebar() {
  log_step "Phase 5: Updating AdminSidebar menu"

  if [ ! -f "src/components/layout/AdminSidebar.tsx" ]; then
    log_warning "AdminSidebar not found. Skipping sidebar update."
    return 0
  fi

  # NOTE: Updated href for tracking to /admin/tracking to avoid route conflict
  cat > src/components/layout/AdminSidebar.tsx << 'EOF'
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  MapPin,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  Boxes,
  BarChart3,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/hooks';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/medicines', label: 'Medicines', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: 3 },
  { href: '/admin/logistics', label: 'Logistics', icon: Truck },
  { href: '/admin/delivery-men', label: 'Delivery Team', icon: Users },
  { href: '/admin/tracking', label: 'Live Tracking', icon: MapPin },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

const bottomMenuItems: MenuItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={`p-4 border-b border-gray-100 ${isCollapsed ? 'px-2' : 'px-6'}`}>
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <span className="font-bold text-lg text-gray-900 block">MedDelivery</span>
              <span className="text-xs text-gray-500">Admin Panel</span>
            </div>
          )}
        </Link>
      </div>

      {!isCollapsed && (
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ${isCollapsed ? 'text-center' : 'px-3'}`}>
          {isCollapsed ? '•••' : 'Main Menu'}
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {isCollapsed && item.badge && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4 space-y-1">
        {bottomMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        <div className={`mt-4 pt-4 border-t border-gray-100 ${isCollapsed ? 'text-center' : ''}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium text-sm">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-primary-600 font-medium text-sm">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
          )}

          <button
            onClick={() => logout()}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        )}
      </button>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-900"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      <aside
        className={`
          hidden lg:block relative bg-white border-r border-gray-100 transition-all duration-300
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
EOF

  log_success "AdminSidebar updated (Analytics added)"
}

#==============================================================================
# PHASE 6: Update admin exports (optional)
#==============================================================================

update_admin_exports() {
  log_step "Phase 6: Updating admin exports"

  # Add analytics export to admin index if it exists
  if [ -f "src/components/admin/index.ts" ]; then
    # Add AdminHeader export and Analytics
    cat > src/components/admin/index.ts << 'EOF'
export { AdminHeader } from '../layout/AdminHeader';
export * from './StatsCard';
export * from './StatsGrid';
export * from './MiniStatsCard';

// Table Components
export * from './DataTable';
export * from './RowActions';

// Chart Components
export * from './SimpleBarChart';
export * from './SimpleLineChart';
export * from './DonutChart';

// Widget Components
export * from './RecentOrdersWidget';
export * from './LowStockWidget';
export * from './ActivityFeedWidget';

// Domain Components
export * from './orders';
export * from './medicines';

// Stock Components
export {
  StockOverview,
  StockUpdateModal,
  StockAlertsList,
  StockByCategory,
  QuickStockUpdate,
} from './stock';

// Analytics
export { AnalyticsDashboard } from './analytics';
EOF
  fi

  log_success "Admin exports updated"
}

#==============================================================================
# PHASE 7: Verify + Commit
#==============================================================================

verify_setup() {
  log_step "Phase 7: Verification"

  local files=(
    "src/app/api/admin/analytics/overview/route.ts"
    "src/components/admin/analytics/AnalyticsDashboard.tsx"
    "src/components/admin/analytics/index.ts"
    "src/app/(admin)/analytics/page.tsx"
  )

  local all_good=true
  for file in "${files[@]}"; do
    if [ -f "$file" ]; then
      echo -e "  ${GREEN}✓${NC} $file"
    else
      echo -e "  ${RED}✗${NC} $file"
      all_good=false
    fi
  done

  if [ "$all_good" = true ]; then
    log_success "All Day 20 files created!"
  else
    log_warning "Some files are missing."
  fi
}

git_commit() {
  log_step "Phase 8: Git Commit"

  if [ -d ".git" ]; then
    git add .
    git commit -m "Day 20: Analytics

- Added admin analytics API (overview) with aggregates
- Built analytics dashboard with real charts (revenue/orders/status)
- Added top categories and top products
- Created /analytics admin page
- Updated AdminSidebar to include Analytics"
    log_success "Committed changes!"
  else
    log_warning "Not a git repository, skipping commit"
  fi
}

show_completion() {
  log_step "✅ Day 20 Complete!"
  echo ""
  echo -e "${YELLOW}What you can do now:${NC}"
  echo "  • Admin visits /analytics for revenue + orders charts"
  echo "  • Change period: 7d / 30d / 90d"
  echo "  • See top categories and products"
  echo ""
  echo -e "${YELLOW}API:${NC}"
  echo "  • GET /api/admin/analytics/overview?period=7d|30d|90d"
  echo ""
  echo -e "${YELLOW}Next (Day 21):${NC}"
  echo "  • Edge cases: cancellations, payment failures, refunds (manual trigger)"
  echo ""
}

main() {
  show_banner
  verify_project
  create_admin_analytics_api
  create_analytics_components
  create_analytics_page
  update_admin_sidebar
  update_admin_exports
  verify_setup
  git_commit
  show_completion
}

main
