#!/bin/bash

#==============================================================================
# 🏥 MedDelivery MVP - Day 18: Customer Map Tracking
# Google Maps (preferred) + polling + ETA + secure tracking API
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
║     🏥 MedDelivery MVP - Day 18: Customer Map Tracking        ║
║                                                              ║
║     Today: Map view + polling + ETA + secure tracking API     ║
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

  if [ ! -f "src/lib/db/models/Order.ts" ]; then
    log_error "Order model not found. Run Day 2."
    exit 1
  fi

  if [ ! -f "src/lib/auth/api-auth.ts" ]; then
    log_error "API auth helpers not found. Run Day 4."
    exit 1
  fi

  if [ ! -f "src/app/api/location/route.ts" ]; then
    log_warning "Day 17 /api/location not found. Live driver GPS updates may be missing."
  fi

  log_success "Project verified!"
}

#==============================================================================
# PHASE 2: Install Google Maps dependency
#==============================================================================

install_maps_dep() {
  log_step "Phase 2: Installing Google Maps dependency"

  if ! grep -q "\"@react-google-maps/api\"" package.json; then
    log_info "Installing @react-google-maps/api..."
    npm install @react-google-maps/api
    log_success "Installed @react-google-maps/api"
  else
    log_success "@react-google-maps/api already installed"
  fi
}

#==============================================================================
# PHASE 3: Geo utilities (ETA + distance)
#==============================================================================

create_geo_utils() {
  log_step "Phase 3: Creating Geo Utilities"

  mkdir -p src/lib

  cat > src/lib/geo.ts << 'EOF'
export function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371; // km
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Rough ETA estimate using constant speed.
 * This is intentionally simple; you can replace with Google Distance Matrix later.
 */
export function estimateEtaMinutes(distanceKm: number, speedKmh: number = 25) {
  if (!isFinite(distanceKm) || distanceKm <= 0) return 0;
  const hours = distanceKm / speedKmh;
  return Math.max(1, Math.round(hours * 60));
}

export function formatEta(minutes: number) {
  if (!minutes || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
EOF

  log_success "Geo utilities created!"
}

#==============================================================================
# PHASE 4: Tracking API (secure, by orderId)
#==============================================================================

create_tracking_api() {
  log_step "Phase 4: Creating secure order tracking API"

  mkdir -p "src/app/api/orders/[id]/tracking"

  cat > "src/app/api/orders/[id]/tracking/route.ts" << 'EOF'
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { withAuth } from '@/lib/auth';
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';

export const GET = withAuth(async (request: NextRequest, { user, params }) => {
  try {
    await connectDB();

    const id = params?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const order = await Order.findById(id)
      .populate('customer', 'name email phone')
      .populate('deliveryMan', 'name phone lastLocation')
      .select('orderNumber status paymentStatus deliveryAddress deliveryLocation deliveryMan customer createdAt updatedAt estimatedDelivery actualDelivery')
      .lean();

    if (!order) return notFoundResponse('Order not found');

    const role = (user as any).role;

    // Authorization:
    // - customer can see only their order
    // - admin can see any
    // - delivery can see if assigned
    const customerId = (order as any).customer?._id?.toString?.() || (order as any).customer?.toString?.();
    const deliveryManId = (order as any).deliveryMan?._id?.toString?.() || (order as any).deliveryMan?.toString?.();

    const isAdmin = role === 'admin';
    const isCustomerOwner = role === 'customer' && customerId === user.id;
    const isAssignedDriver = role === 'delivery' && deliveryManId === user.id;

    if (!isAdmin && !isCustomerOwner && !isAssignedDriver) {
      return errorResponse('Forbidden', 403);
    }

    const destinationCoords =
      (order as any).deliveryAddress?.coordinates?.lat != null &&
      (order as any).deliveryAddress?.coordinates?.lng != null
        ? {
            lat: (order as any).deliveryAddress.coordinates.lat,
            lng: (order as any).deliveryAddress.coordinates.lng,
          }
        : null;

    // Prefer order.deliveryLocation (updated by Day 17 /api/location)
    const driverCoords =
      (order as any).deliveryLocation?.lat != null && (order as any).deliveryLocation?.lng != null
        ? {
            lat: (order as any).deliveryLocation.lat,
            lng: (order as any).deliveryLocation.lng,
            updatedAt: (order as any).deliveryLocation.updatedAt,
            source: 'order.deliveryLocation',
          }
        : (order as any).deliveryMan?.lastLocation?.lat != null && (order as any).deliveryMan?.lastLocation?.lng != null
          ? {
              lat: (order as any).deliveryMan.lastLocation.lat,
              lng: (order as any).deliveryMan.lastLocation.lng,
              updatedAt: (order as any).deliveryMan.lastLocation.updatedAt,
              source: 'user.lastLocation',
            }
          : null;

    return successResponse({
      _id: (order as any)._id.toString(),
      orderNumber: (order as any).orderNumber,
      status: (order as any).status,
      paymentStatus: (order as any).paymentStatus,
      createdAt: (order as any).createdAt,
      updatedAt: (order as any).updatedAt,
      estimatedDelivery: (order as any).estimatedDelivery,
      actualDelivery: (order as any).actualDelivery,
      deliveryAddress: (order as any).deliveryAddress,
      destinationCoords,
      driverCoords,
      deliveryMan: (order as any).deliveryMan
        ? {
            _id: (order as any).deliveryMan._id.toString(),
            name: (order as any).deliveryMan.name,
            phone: (order as any).deliveryMan.phone,
          }
        : null,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
});
EOF

  log_success "Secure tracking API created!"
}

#==============================================================================
# PHASE 5: Client hook: polling tracking data
#==============================================================================

create_tracking_hook() {
  log_step "Phase 5: Creating useOrderTracking hook"

  mkdir -p src/hooks

  cat > src/hooks/useOrderTracking.ts << 'EOF'
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface OrderTrackingData {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  destinationCoords: { lat: number; lng: number } | null;
  driverCoords: { lat: number; lng: number; updatedAt?: string; source?: string } | null;
  deliveryAddress: any;
  deliveryMan: { _id: string; name: string; phone?: string } | null;
  updatedAt?: string;
}

export function useOrderTracking(orderId: string, intervalMs: number = 5000) {
  const [data, setData] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  const fetchOnce = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}/tracking`, { cache: 'no-store' as any });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load tracking data');
    return json.data as OrderTrackingData;
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const first = await fetchOnce();
        if (!cancelled) setData(first);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Tracking failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    timerRef.current = setInterval(async () => {
      try {
        const next = await fetchOnce();
        if (!cancelled) setData(next);
      } catch {
        // keep last state; avoid spamming errors
      }
    }, intervalMs);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchOnce, intervalMs]);

  return { data, loading, error };
}
EOF

  # Update hooks index (keep prior exports if you have them; we overwrite safely with common exports)
  cat > src/hooks/index.ts << 'EOF'
export { useAuth } from './useAuth';
export { useSocket } from './useSocket';
export { useLocationSharing } from './useLocationSharing';
export { useOrderTracking } from './useOrderTracking';
EOF

  log_success "useOrderTracking hook created and hooks/index.ts updated"
}

#==============================================================================
# PHASE 6: Google Map component with driver + destination markers
#==============================================================================

create_tracking_components() {
  log_step "Phase 6: Creating Customer Tracking Components"

  mkdir -p src/components/customer/tracking

  cat > src/components/customer/tracking/GoogleTrackingMap.tsx << 'EOF'
'use client';

import React, { useMemo } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

export function GoogleTrackingMap({
  destination,
  driver,
}: {
  destination: { lat: number; lng: number } | null;
  driver: { lat: number; lng: number } | null;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded } = useJsApiLoader({
    id: 'meddelivery-google-maps',
    googleMapsApiKey: apiKey,
  });

  const center = useMemo(() => {
    if (driver) return driver;
    if (destination) return destination;
    return { lat: 40.7128, lng: -74.0060 }; // fallback
  }, [driver, destination]);

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
        Google Maps API key missing. Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code>.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[420px] w-full rounded-xl border border-gray-200 bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading map…</div>
      </div>
    );
  }

  return (
    <div className="h-[420px] w-full rounded-xl overflow-hidden border border-gray-200">
      <GoogleMap
        center={center}
        zoom={14}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        }}
      >
        {destination && (
          <Marker
            position={destination}
            label={{ text: 'D', color: 'white' }}
          />
        )}

        {driver && (
          <Marker
            position={driver}
            label={{ text: '🚚', color: 'black' }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
EOF

  cat > src/components/customer/tracking/TrackingPanel.tsx << 'EOF'
'use client';

import React, { useMemo } from 'react';
import { MapPin, Truck, Phone, Clock } from 'lucide-react';
import { Badge, Card, CardContent } from '@/components/ui';
import { haversineKm, estimateEtaMinutes, formatEta } from '@/lib/geo';
import type { OrderTrackingData } from '@/hooks/useOrderTracking';

export function TrackingPanel({ data }: { data: OrderTrackingData }) {
  const destination = data.destinationCoords;
  const driver = data.driverCoords ? { lat: data.driverCoords.lat, lng: data.driverCoords.lng } : null;

  const eta = useMemo(() => {
    if (!destination || !driver) return null;
    const km = haversineKm(destination, driver);
    const mins = estimateEtaMinutes(km, 25);
    return { km, mins };
  }, [destination, driver]);

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500">Order</div>
            <div className="text-lg font-semibold text-gray-900">{data.orderNumber}</div>
          </div>
          <Badge variant="info" className="capitalize">
            {String(data.status).replace('_', ' ')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-900">Destination</div>
              <div className="text-sm text-gray-600">
                {data.deliveryAddress?.street || '—'}
                <div className="text-xs text-gray-500">
                  {data.deliveryAddress?.city || ''} {data.deliveryAddress?.state || ''} {data.deliveryAddress?.zipCode || ''}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Truck className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-900">Driver</div>
              <div className="text-sm text-gray-600">
                {data.deliveryMan?.name || 'Not assigned'}
              </div>
              {data.deliveryMan?.phone && (
                <a className="text-xs text-primary-600" href={`tel:${data.deliveryMan.phone}`}>
                  <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> Call</span>
                </a>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-900">ETA</div>
              <div className="text-sm text-gray-600">
                {eta ? formatEta(eta.mins) : '—'}
              </div>
              {eta && (
                <div className="text-xs text-gray-500">
                  ~{eta.km.toFixed(1)} km away (approx.)
                </div>
              )}
            </div>
          </div>
        </div>

        {data.driverCoords?.updatedAt && (
          <div className="text-xs text-gray-500">
            Driver location updated: {new Date(data.driverCoords.updatedAt).toLocaleString()} ({data.driverCoords.source})
          </div>
        )}
      </CardContent>
    </Card>
  );
}
EOF

  cat > src/components/customer/tracking/index.ts << 'EOF'
export { GoogleTrackingMap } from './GoogleTrackingMap';
export { TrackingPanel } from './TrackingPanel';
EOF

  log_success "Customer tracking components created!"
}

#==============================================================================
# PHASE 7: Customer page: /track/[orderId]
#==============================================================================

create_tracking_page() {
  log_step "Phase 7: Creating /track/[orderId] page"

  mkdir -p "src/app/(customer)/track/[orderId]"

  cat > "src/app/(customer)/track/[orderId]/TrackingClient.tsx" << 'EOF'
'use client';

import React from 'react';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { GoogleTrackingMap, TrackingPanel } from '@/components/customer/tracking';
import { Card, CardContent, Spinner } from '@/components/ui';

export function TrackingClient({ orderId }: { orderId: string }) {
  const { data, loading, error } = useOrderTracking(orderId, 5000);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-red-600">
          {error || 'Unable to load tracking data.'}
        </CardContent>
      </Card>
    );
  }

  const destination = data.destinationCoords;
  const driver = data.driverCoords ? { lat: data.driverCoords.lat, lng: data.driverCoords.lng } : null;

  return (
    <div className="space-y-6">
      <TrackingPanel data={data} />
      <GoogleTrackingMap destination={destination} driver={driver} />
    </div>
  );
}
EOF

  cat > "src/app/(customer)/track/[orderId]/page.tsx" << 'EOF'
import { requireCustomer } from '@/lib/auth';
import { TrackingClient } from './TrackingClient';

export default async function TrackOrderPage({
  params,
}: {
  params: { orderId: string };
}) {
  await requireCustomer();
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
      <TrackingClient orderId={params.orderId} />
    </div>
  );
}
EOF

  log_success "/track/[orderId] page created!"
}

#==============================================================================
# PHASE 8: Verification + Commit
#==============================================================================

verify_setup() {
  log_step "Phase 8: Verification"

  local files=(
    "src/lib/geo.ts"
    "src/app/api/orders/[id]/tracking/route.ts"
    "src/hooks/useOrderTracking.ts"
    "src/components/customer/tracking/GoogleTrackingMap.tsx"
    "src/components/customer/tracking/TrackingPanel.tsx"
    "src/app/(customer)/track/[orderId]/page.tsx"
    "src/app/(customer)/track/[orderId]/TrackingClient.tsx"
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
    log_success "All Day 18 files created!"
  else
    log_warning "Some files are missing."
  fi
}

git_commit() {
  log_step "Phase 9: Git Commit"

  if [ -d ".git" ]; then
    git add .
    git commit -m "Day 18: Customer map tracking

- Added secure order tracking API by orderId
- Implemented polling hook for live updates
- Built Google Maps tracking map with driver + destination markers
- Added ETA estimate using haversine distance
- Created customer live tracking page /track/[orderId]"
    log_success "Committed changes!"
  else
    log_warning "Not a git repository, skipping commit"
  fi
}

show_completion() {
  log_step "✅ Day 18 Complete!"
  echo ""
  echo -e "${YELLOW}What you got:${NC}"
  echo "  • Customer tracking page: /track/:orderId"
  echo "  • Live updates via polling every 5 seconds"
  echo "  • Google Map with driver + destination markers"
  echo "  • ETA (approx.)"
  echo ""
  echo -e "${YELLOW}API:${NC}"
  echo "  • GET /api/orders/:id/tracking (auth required; customer only sees own order)"
  echo ""
  echo -e "${YELLOW}Important note:${NC}"
  echo "  • Destination marker requires deliveryAddress.coordinates to exist."
  echo "    If you haven't added coordinates yet, the map will still load, but only driver marker may appear."
  echo ""
  echo -e "${YELLOW}Next (Day 19):${NC}"
  echo "  • Admin live tracking map (all active deliveries)"
  echo ""
}

main() {
  show_banner
  verify_project
  install_maps_dep
  create_geo_utils
  create_tracking_api
  create_tracking_hook
  create_tracking_components
  create_tracking_page
  verify_setup
  git_commit
  show_completion
}

main
