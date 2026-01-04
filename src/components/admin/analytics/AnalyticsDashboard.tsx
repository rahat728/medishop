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
