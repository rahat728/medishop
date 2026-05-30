'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AdminHeader } from '@/components/layout';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { LocationSharingCard } from '@/components/delivery/LocationSharingCard';

export default function DeliveryActivePage() {
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/delivery/orders?status=active');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load active orders');

        const orders = json.data.orders || [];
        setActiveOrder(orders[0] || null);
      } catch (e: any) {
        toast.error(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <div className="space-y-6">
      <AdminHeader title="Active Delivery" subtitle="Share your location and complete delivery" />

      <LocationSharingCard orderId={activeOrder?._id} />

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-gray-500">Loading…</div>
          ) : !activeOrder ? (
            <div className="text-gray-600">No active delivery right now.</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-gray-500">{activeOrder.orderNumber}</span>
                {activeOrder.isEmergency && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-sm shadow-red-200">
                        🚑 URGENT
                    </span>
                )}
                <Badge variant="info">{String(activeOrder.status).replace('_', ' ')}</Badge>
              </div>

              <div className="text-sm text-gray-700">
                Deliver to: Ward No {activeOrder.deliveryAddress?.wardNo}
              </div>

              <div className="text-sm text-gray-600">
                Customer: {activeOrder.customer?.name} • {activeOrder.customer?.phone}
              </div>

              <div className="flex gap-3 pt-2">
                <Link href={`/my-orders/${activeOrder._id}`}>
                  <Button>Open Order</Button>
                </Link>
                <a
                  className="inline-flex"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    activeOrder.deliveryAddress?.street
                      ? `${activeOrder.deliveryAddress.street}, ${activeOrder.deliveryAddress.city}`
                      : `Ward No ${activeOrder.deliveryAddress?.wardNo}, Khulna`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="secondary">Open in Maps</Button>
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
