'use client';

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import { AdminHeader } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { AdminLiveTrackingMap, TrackingSidebar, type AdminTrackedOrder } from '@/components/admin/tracking';

type StatusFilter = 'all' | 'assigned' | 'picked_up' | 'on_the_way';

export default function AdminTrackingPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<AdminTrackedOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [coordsFilter, setCoordsFilter] = useState<'all' | 'true' | 'false'>('all');
  const [search, setSearch] = useState('');

  const fetchActive = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (coordsFilter !== 'all') params.set('hasCoords', coordsFilter);

      const res = await fetch(`/api/admin/tracking/active?${params.toString()}`, { cache: 'no-store' as any });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load active tracking');

      setOrders(json.data.orders || []);
      if (selectedOrderId) {
        const stillExists = (json.data.orders || []).some((o: AdminTrackedOrder) => o._id === selectedOrderId);
        if (!stillExists) setSelectedOrderId(null);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
    const t = setInterval(fetchActive, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, coordsFilter]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((o) => {
      const hay = [
        o.orderNumber,
        o.deliveryMan?.name,
        o.customer?.name,
        o.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return hay.includes(q);
    });
  }, [orders, search]);

  const stats = useMemo(() => {
    const withCoords = orders.filter((o) => !!o.driverCoords).length;
    return {
      total: orders.length,
      withCoords,
      withoutCoords: orders.length - withCoords,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Live Tracking"
        subtitle="Monitor all active deliveries in real time"
        actions={
          <Button
            variant="secondary"
            onClick={fetchActive}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="info">Active: {stats.total}</Badge>
        <Badge variant="success">With GPS: {stats.withCoords}</Badge>
        <Badge variant="warning">No GPS: {stats.withoutCoords}</Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
        >
          <option value="all">All Active</option>
          <option value="assigned">Assigned</option>
          <option value="picked_up">Picked Up</option>
          <option value="on_the_way">On The Way</option>
        </select>

        <select
          value={coordsFilter}
          onChange={(e) => setCoordsFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
        >
          <option value="all">All GPS</option>
          <option value="true">Only with GPS</option>
          <option value="false">Only without GPS</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <TrackingSidebar
            orders={filteredOrders}
            selectedOrderId={selectedOrderId}
            onSelectOrder={(id) => setSelectedOrderId(id)}
            search={search}
            setSearch={setSearch}
          />
        </div>

        <div className="xl:col-span-2">
          <AdminLiveTrackingMap
            orders={filteredOrders}
            selectedOrderId={selectedOrderId}
            onSelectOrder={(id) => setSelectedOrderId(id)}
          />
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Updates every 5s. Driver marker comes from <code>order.deliveryLocation</code> (preferred) or <code>user.lastLocation</code> (fallback).
      </div>
    </div>
  );
}
