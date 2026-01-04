#!/bin/bash

#==============================================================================
# 🏥 MedDelivery MVP - Day 19: Admin Live Tracking
# Admin map, active deliveries, polling updates
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
  # clear removed for CI/CD compatibility
  echo -e "${CYAN}"
  cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🏥 MedDelivery MVP - Day 19: Admin Live Tracking          ║
║                                                              ║
║     Today: Admin map + active deliveries + polling            ║
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

  if [ ! -f "src/lib/db/models/Order.ts" ] || [ ! -f "src/lib/db/models/User.ts" ]; then
    log_error "DB models not found. Run Day 2."
    exit 1
  fi

  if [ ! -f "src/lib/auth/api-auth.ts" ]; then
    log_error "API auth helpers not found. Run Day 4."
    exit 1
  fi

  # Map library from Day 18
  if ! grep -q "\"@react-google-maps/api\"" package.json; then
    log_warning "@react-google-maps/api not found. Installing it now..."
    npm install @react-google-maps/api
  fi

  log_success "Project verified!"
}

#==============================================================================
# PHASE 2: Create Admin Tracking API
#==============================================================================

create_admin_tracking_api() {
  log_step "Phase 2: Creating Admin Tracking API"

  mkdir -p src/app/api/admin/tracking/active

  cat > src/app/api/admin/tracking/active/route.ts << 'EOF'
import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api-response';

const ACTIVE_STATUSES = ['assigned', 'picked_up', 'on_the_way'] as const;

// GET /api/admin/tracking/active
// Returns all active deliveries with best-available driver coords.
export const GET = withAdmin(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // optional filter
    const hasCoords = searchParams.get('hasCoords'); // 'true' | 'false'

    const query: any = {
      status: { $in: ACTIVE_STATUSES },
    };

    if (status && ACTIVE_STATUSES.includes(status as any)) {
      query.status = status;
    }

    // Load active orders with driver + customer
    const orders = await Order.find(query)
      .populate('customer', 'name phone email')
      .populate('deliveryMan', 'name phone lastLocation')
      .select(
        'orderNumber status paymentStatus totalAmount deliveryAddress deliveryLocation deliveryMan customer createdAt updatedAt'
      )
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const items = orders.map((o: any) => {
      const destinationCoords =
        o.deliveryAddress?.coordinates?.lat != null && o.deliveryAddress?.coordinates?.lng != null
          ? { lat: o.deliveryAddress.coordinates.lat, lng: o.deliveryAddress.coordinates.lng }
          : null;

      // Prefer order.deliveryLocation (Day 17), fallback to driver.lastLocation (Day 2)
      const driverCoords =
        o.deliveryLocation?.lat != null && o.deliveryLocation?.lng != null
          ? {
              lat: o.deliveryLocation.lat,
              lng: o.deliveryLocation.lng,
              updatedAt: o.deliveryLocation.updatedAt,
              source: 'order.deliveryLocation',
            }
          : o.deliveryMan?.lastLocation?.lat != null && o.deliveryMan?.lastLocation?.lng != null
            ? {
                lat: o.deliveryMan.lastLocation.lat,
                lng: o.deliveryMan.lastLocation.lng,
                updatedAt: o.deliveryMan.lastLocation.updatedAt,
                source: 'user.lastLocation',
              }
            : null;

      return {
        _id: o._id.toString(),
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        customer: o.customer
          ? {
              _id: o.customer._id?.toString?.() || '',
              name: o.customer.name,
              phone: o.customer.phone,
              email: o.customer.email,
            }
          : null,
        deliveryMan: o.deliveryMan
          ? {
              _id: o.deliveryMan._id?.toString?.() || '',
              name: o.deliveryMan.name,
              phone: o.deliveryMan.phone,
            }
          : null,
        destinationCoords,
        driverCoords,
        deliveryAddress: o.deliveryAddress || null,
      };
    });

    let filtered = items;

    if (hasCoords === 'true') {
      filtered = filtered.filter((x) => !!x.driverCoords);
    }
    if (hasCoords === 'false') {
      filtered = filtered.filter((x) => !x.driverCoords);
    }

    // Summary
    const summary = {
      total: items.length,
      withDriverCoords: items.filter((x) => !!x.driverCoords).length,
      withoutDriverCoords: items.filter((x) => !x.driverCoords).length,
      byStatus: {
        assigned: items.filter((x) => x.status === 'assigned').length,
        picked_up: items.filter((x) => x.status === 'picked_up').length,
        on_the_way: items.filter((x) => x.status === 'on_the_way').length,
      },
    };

    return successResponse({ orders: filtered, summary });
  } catch (error) {
    return serverErrorResponse(error);
  }
});
EOF

  log_success "Admin tracking API created!"
}

#==============================================================================
# PHASE 3: Create Admin Tracking UI Components
#==============================================================================

create_admin_tracking_components() {
  log_step "Phase 3: Creating Admin Tracking Components"

  mkdir -p src/components/admin/tracking

  cat > src/components/admin/tracking/AdminLiveTrackingMap.tsx << 'EOF'
'use client';

import React, { useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

export interface AdminTrackedOrder {
  _id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  driverCoords: { lat: number; lng: number; updatedAt?: string; source?: string } | null;
  destinationCoords: { lat: number; lng: number } | null;
  deliveryMan: { _id: string; name: string; phone?: string } | null;
  customer: { _id: string; name: string; phone?: string } | null;
  deliveryAddress?: any;
}

export function AdminLiveTrackingMap({
  orders,
  selectedOrderId,
  onSelectOrder,
}: {
  orders: AdminTrackedOrder[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string | null) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded } = useJsApiLoader({
    id: 'meddelivery-admin-tracking',
    googleMapsApiKey: apiKey,
  });

  const selected = useMemo(
    () => orders.find((o) => o._id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const defaultCenter = useMemo(() => {
    // Prefer first driver location; else first destination; else fallback NYC
    const firstDriver = orders.find((o) => o.driverCoords)?.driverCoords;
    if (firstDriver) return { lat: firstDriver.lat, lng: firstDriver.lng };
    const firstDest = orders.find((o) => o.destinationCoords)?.destinationCoords;
    if (firstDest) return { lat: firstDest.lat, lng: firstDest.lng };
    return { lat: 40.7128, lng: -74.0060 };
  }, [orders]);

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
        Google Maps API key missing. Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code>.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[520px] w-full rounded-xl border border-gray-200 bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading map…</div>
      </div>
    );
  }

  return (
    <div className="h-[520px] w-full rounded-xl overflow-hidden border border-gray-200">
      <GoogleMap
        center={selected?.driverCoords || selected?.destinationCoords || defaultCenter}
        zoom={13}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        }}
      >
        {orders.map((o) => {
          const driver = o.driverCoords;
          const dest = o.destinationCoords;

          return (
            <React.Fragment key={o._id}>
              {dest && (
                <Marker
                  position={dest}
                  label={{ text: 'D', color: 'white' }}
                  onClick={() => onSelectOrder(o._id)}
                />
              )}

              {driver && (
                <Marker
                  position={{ lat: driver.lat, lng: driver.lng }}
                  label={{ text: '🚚', color: 'black' }}
                  onClick={() => onSelectOrder(o._id)}
                />
              )}
            </React.Fragment>
          );
        })}

        {selected && (selected.driverCoords || selected.destinationCoords) && (
          <InfoWindow
            position={
              selected.driverCoords
                ? { lat: selected.driverCoords.lat, lng: selected.driverCoords.lng }
                : { lat: selected.destinationCoords!.lat, lng: selected.destinationCoords!.lng }
            }
            onCloseClick={() => onSelectOrder(null)}
          >
            <div className="text-sm">
              <div className="font-semibold">{selected.orderNumber}</div>
              <div className="text-gray-700 capitalize">Status: {String(selected.status).replace('_', ' ')}</div>
              <div className="text-gray-700">Total: ${selected.totalAmount?.toFixed?.(2) ?? selected.totalAmount}</div>
              <div className="mt-2">
                <div className="text-gray-600">Driver: {selected.deliveryMan?.name || 'Not assigned'}</div>
                <div className="text-gray-600">Customer: {selected.customer?.name || 'Unknown'}</div>
              </div>
              {selected.driverCoords?.updatedAt && (
                <div className="mt-2 text-xs text-gray-500">
                  Loc updated: {new Date(selected.driverCoords.updatedAt).toLocaleString()} ({selected.driverCoords.source})
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
EOF

  cat > src/components/admin/tracking/TrackingSidebar.tsx << 'EOF'
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
EOF

  cat > src/components/admin/tracking/index.ts << 'EOF'
export { AdminLiveTrackingMap } from './AdminLiveTrackingMap';
export type { AdminTrackedOrder } from './AdminLiveTrackingMap';
export { TrackingSidebar } from './TrackingSidebar';
EOF

  log_success "Admin tracking components created!"
}

#==============================================================================
# PHASE 4: Admin Tracking Page (replace placeholder)
#==============================================================================

create_admin_tracking_page() {
  log_step "Phase 4: Creating Admin Live Tracking Page (/tracking)"

  mkdir -p "src/app/(admin)/tracking"

  cat > "src/app/(admin)/tracking/page.tsx" << 'EOF'
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
EOF

  log_success "Admin tracking page created!"
}

#==============================================================================
# PHASE 5: Verify & Commit
#==============================================================================

verify_setup() {
  log_step "Phase 5: Verification"

  local files=(
    "src/app/api/admin/tracking/active/route.ts"
    "src/components/admin/tracking/AdminLiveTrackingMap.tsx"
    "src/components/admin/tracking/TrackingSidebar.tsx"
    "src/components/admin/tracking/index.ts"
    "src/app/(admin)/tracking/page.tsx"
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
    log_success "All Day 19 files created!"
  else
    log_warning "Some files are missing."
  fi
}

git_commit() {
  log_step "Phase 6: Git Commit"

  if [ -d ".git" ]; then
    git add .
    git commit -m "Day 19: Admin live tracking

- Added admin tracking API for active deliveries
- Built admin live map with driver + destination markers
- Added sidebar list with search and selection
- Implemented polling refresh every 5s
- Replaced admin /tracking placeholder with live control tower"
    log_success "Committed changes!"
  else
    log_warning "Not a git repository, skipping commit"
  fi
}

show_completion() {
  log_step "✅ Day 19 Complete!"
  echo ""
  echo -e "${YELLOW}What you can do now:${NC}"
  echo "  • Admin goes to /tracking and sees all active deliveries on the map"
  echo "  • Sidebar search by order number, driver name, customer name"
  echo "  • Auto-refresh every 5 seconds"
  echo ""
  echo -e "${YELLOW}API:${NC}"
  echo "  • GET /api/admin/tracking/active?status=assigned|picked_up|on_the_way&hasCoords=true|false"
  echo ""
  echo -e "${YELLOW}Next (Day 20):${NC}"
  echo "  • Analytics dashboard (orders + revenue charts) using real DB data"
  echo ""
}

#==============================================================================
# Main
#==============================================================================

main() {
  show_banner
  verify_project
  create_admin_tracking_api
  create_admin_tracking_components
  create_admin_tracking_page
  verify_setup
  git_commit
  show_completion
}

main
