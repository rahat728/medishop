'use client';

import React from 'react';
import Link from 'next/link';
import { Search, MapPin } from 'lucide-react';
import { Badge, Card, CardContent, Input } from '@/components/ui';
import type { AdminTrackedOrder } from './AdminLiveTrackingMap';

export function TrackingSidebar({
  orders,
  selectedOrderId,
  onSelectOrder,
  search,
  setSearch,
}: {
  orders: AdminTrackedOrder[];
  selectedOrderId: string | null;
  onSelectOrder: (id: string) => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  return (
    <Card className="h-[520px] overflow-hidden">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="mb-3">
          <Input
            label="Search"
            placeholder="Order #, driver, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {orders.length === 0 ? (
            <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
              No active deliveries.
            </div>
          ) : (
            orders.map((o) => (
              <button
                key={o._id}
                onClick={() => onSelectOrder(o._id)}
                className={`
                  w-full text-left p-3 rounded-lg border transition-colors
                  ${selectedOrderId === o._id ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-white hover:bg-gray-50'}
                `}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-xs text-gray-500">{o.orderNumber}</div>
                  <Badge variant="info" className="capitalize">
                    {String(o.status).replace('_', ' ')}
                  </Badge>
                </div>

                <div className="mt-2 text-sm text-gray-900">
                  Driver: {o.deliveryMan?.name || 'Not assigned'}
                </div>
                <div className="text-xs text-gray-600">
                  Customer: {o.customer?.name || 'Unknown'}
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {o.driverCoords ? 'Live location available' : 'No live location yet'}
                </div>

                <div className="mt-2">
                  <Link className="text-xs text-primary-600 hover:underline" href={`/orders/${o._id}`}>
                    Open order →
                  </Link>
                </div>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
