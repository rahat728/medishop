'use client';

import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

const SimpleBarChart = dynamic(() => import('@/components/admin').then(mod => mod.SimpleBarChart), { ssr: false });
const DonutChart = dynamic(() => import('@/components/admin').then(mod => mod.DonutChart), { ssr: false });

interface DashboardChartsProps {
  weeklyOrders: { label: string; value: number }[];
  donutData: { label: string; value: number; color: string }[];
  totalOrders: string;
}

export function DashboardCharts({ weeklyOrders, donutData, totalOrders }: DashboardChartsProps) {
  return (
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
              centerValue={totalOrders}
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
  );
}
