#!/bin/bash

#==============================================================================
# 🏥 MedDelivery MVP - Day 17: Location Sharing
# Geolocation API → backend → MongoDB (User.lastLocation + Order.deliveryLocation)
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
║     🏥 MedDelivery MVP - Day 17: Location Sharing             ║
║                                                              ║
║     Today: Driver GPS → Backend → MongoDB                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
  echo -e "${NC}"
}

#==============================================================================
# PHASE 1: Verify
#==============================================================================

verify_project() {
  log_step "Phase 1: Verifying Project"

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

  if [ ! -f "src/lib/db/models/User.ts" ] || [ ! -f "src/lib/db/models/Order.ts" ]; then
    log_error "Models not found. Run Day 2."
    exit 1
  fi

  if [ ! -f "src/lib/auth/api-auth.ts" ]; then
    log_error "API auth helpers not found. Run Day 4."
    exit 1
  fi

  log_success "Project verified!"
}

#==============================================================================
# PHASE 2: Safety fixes (optional but recommended)
#==============================================================================

install_leaflet_if_needed() {
  log_step "Phase 2: Installing Leaflet deps if TrackingMap exists"

  if [ -f "src/components/map/TrackingMap.tsx" ]; then
    if ! grep -q "\"leaflet\"" package.json; then
      log_info "Installing leaflet + react-leaflet..."
      npm install leaflet react-leaflet
      npm install -D @types/leaflet || true
      log_success "Leaflet deps installed"
    else
      log_success "Leaflet deps already installed"
    fi

    # Ensure leaflet CSS is imported (only add if not present)
    if [ -f "src/app/globals.css" ]; then
      if ! grep -q "leaflet/dist/leaflet.css" src/app/globals.css; then
        log_info "Adding Leaflet CSS import to globals.css..."
        # Prepend import line
        tmpfile=$(mktemp)
        echo "@import 'leaflet/dist/leaflet.css';" > "$tmpfile"
        cat src/app/globals.css >> "$tmpfile"
        mv "$tmpfile" src/app/globals.css
        log_success "Leaflet CSS import added"
      else
        log_success "Leaflet CSS import already present"
      fi
    fi
  else
    log_info "TrackingMap not found; skipping Leaflet deps."
  fi
}

fix_hooks_index() {
  log_step "Phase 3: Fixing hooks/index.ts"

  mkdir -p src/hooks

  cat > src/hooks/index.ts << 'EOF'
export { useAuth } from './useAuth';
export { useSocket } from './useSocket';
export { useLocationSharing } from './useLocationSharing';
EOF

  log_success "hooks/index.ts updated"
}

fix_customer_tracking_page_if_present() {
  log_step "Phase 4: Fixing customer tracking page (if present)"

  # If Day 15 created a client page that imports DB, replace it with safe client-only page
  if [ -f "src/app/(customer)/tracking/page.tsx" ]; then
    cat > "src/app/(customer)/tracking/page.tsx" << 'EOF'
'use client';

import React, { useState } from 'react';
import { Search, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { TrackingMap } from '@/components/map';

export default function TrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const handleTrack = async () => {
    if (!orderNumber.trim()) {
      toast.error('Please enter an order number');
      return;
    }

    setLoading(true);
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/tracking/${encodeURIComponent(orderNumber.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Order not found');
      setOrder(json.data);
    } catch (e: any) {
      toast.error(e.message || 'Tracking failed');
    } finally {
      setLoading(false);
    }
  };

  const center =
    order?.deliveryLocation?.lat && order?.deliveryLocation?.lng
      ? [order.deliveryLocation.lat, order.deliveryLocation.lng]
      : order?.deliveryAddress?.coordinates?.lat && order?.deliveryAddress?.coordinates?.lng
        ? [order.deliveryAddress.coordinates.lat, order.deliveryAddress.coordinates.lng]
        : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Track Order</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                label="Order Number"
                placeholder="ORD-20240101-ABC123"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>
            <div className="pt-6 sm:pt-0 sm:self-end">
              <Button
                onClick={handleTrack}
                isLoading={loading}
                leftIcon={<Search className="w-4 h-4" />}
              >
                Track
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {order && (
        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{order.orderNumber}</div>
              <div className="text-sm text-gray-600">Status: {String(order.status).replace('_', ' ')}</div>
              {order.deliveryMan?.name && (
                <div className="text-sm text-gray-600 mt-1">Driver: {order.deliveryMan.name}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {order && center && (
        <TrackingMap
          orderId={order._id}
          center={center}
          zoom={14}
        />
      )}
    </div>
  );
}
EOF
    log_success "Customer tracking page fixed"
  else
    log_info "Customer tracking page not found; skipping."
  fi
}

fix_tracking_api_if_missing() {
  log_step "Phase 5: Ensure public tracking API exists"

  mkdir -p "src/app/api/orders/tracking/[orderNumber]"

  cat > "src/app/api/orders/tracking/[orderNumber]/route.ts" << 'EOF'
import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    await connectDB();

    const orderNumber = params.orderNumber;

    const order = await Order.findOne({ orderNumber })
      .populate('deliveryMan', 'name phone lastLocation')
      .select('orderNumber status deliveryAddress deliveryLocation estimatedDelivery actualDelivery statusHistory deliveryMan createdAt')
      .lean();

    if (!order) {
      return notFoundResponse('Order not found');
    }

    return successResponse({
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      estimatedDelivery: order.estimatedDelivery,
      actualDelivery: order.actualDelivery,
      deliveryAddress: order.deliveryAddress,
      deliveryLocation: order.deliveryLocation,
      deliveryMan: order.deliveryMan
        ? {
            _id: (order.deliveryMan as any)._id.toString(),
            name: (order.deliveryMan as any).name,
            phone: (order.deliveryMan as any).phone,
            lastLocation: (order.deliveryMan as any).lastLocation,
          }
        : null,
      statusHistory: order.statusHistory || [],
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
EOF

  log_success "Tracking API ensured"
}

#==============================================================================
# PHASE 3: Backend Location API
#==============================================================================

create_location_api() {
  log_step "Phase 6: Creating /api/location (delivery GPS updates)"

  mkdir -p src/app/api/location

  cat > src/app/api/location/route.ts << 'EOF'
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { User, Order } from '@/lib/db/models';
import { withDelivery } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { z } from 'zod';

const updateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  orderId: z.string().optional(), // optional: attach to a specific active order
});

// PUT /api/location (delivery-only)
// Updates:
//  - User.lastLocation
//  - Order.deliveryLocation (for active order or specified orderId)
export const PUT = withDelivery(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.errors.map((e) => e.message));
    }

    const { lat, lng, orderId } = parsed.data;

    // Update driver location on User
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      {
        $set: {
          lastLocation: { lat, lng, updatedAt: new Date() },
        },
      },
      { new: true }
    ).select('name role lastLocation');

    if (!updatedUser) {
      return notFoundResponse('User not found');
    }

    // Update active order deliveryLocation
    let updatedOrderId: string | null = null;

    const activeStatuses = ['picked_up', 'on_the_way'];

    if (orderId) {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return errorResponse('Invalid orderId', 400);
      }

      const order = await Order.findOne({
        _id: orderId,
        deliveryMan: user.id,
        status: { $in: activeStatuses },
      });

      if (order) {
        order.deliveryLocation = { lat, lng, updatedAt: new Date() };
        await order.save();
        updatedOrderId = order._id.toString();
      }
    } else {
      const order = await Order.findOne({
        deliveryMan: user.id,
        status: { $in: activeStatuses },
      }).sort({ updatedAt: -1, createdAt: -1 });

      if (order) {
        order.deliveryLocation = { lat, lng, updatedAt: new Date() };
        await order.save();
        updatedOrderId = order._id.toString();
      }
    }

    return successResponse({
      driver: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        lastLocation: updatedUser.lastLocation,
      },
      updatedOrderId,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
});

// GET /api/location (delivery-only) - current driver last location and active order
export const GET = withDelivery(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const me = await User.findById(user.id).select('name lastLocation').lean();
    if (!me) return notFoundResponse('User not found');

    const activeOrder = await Order.findOne({
      deliveryMan: user.id,
      status: { $in: ['picked_up', 'on_the_way'] },
    })
      .select('orderNumber status deliveryLocation')
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    return successResponse({
      driver: {
        id: me._id.toString(),
        name: (me as any).name,
        lastLocation: (me as any).lastLocation || null,
      },
      activeOrder: activeOrder
        ? {
            id: activeOrder._id.toString(),
            orderNumber: (activeOrder as any).orderNumber,
            status: (activeOrder as any).status,
            deliveryLocation: (activeOrder as any).deliveryLocation || null,
          }
        : null,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
});
EOF

  log_success "/api/location created"
}

#==============================================================================
# PHASE 4: Client hook + UI
#==============================================================================

create_location_hook() {
  log_step "Phase 7: Creating useLocationSharing hook"

  mkdir -p src/hooks

  cat > src/hooks/useLocationSharing.ts << 'EOF'
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

type LocationSharingState = 'idle' | 'starting' | 'sharing' | 'error';

interface LocationPayload {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export function useLocationSharing(options?: {
  orderId?: string;
  minIntervalMs?: number; // throttle API calls
}) {
  const orderId = options?.orderId;
  const minIntervalMs = options?.minIntervalMs ?? 5000;

  const watchIdRef = useRef<number | null>(null);
  const lastSentAtRef = useRef<number>(0);

  const [state, setState] = useState<LocationSharingState>('idle');
  const [lastLocation, setLastLocation] = useState<LocationPayload | null>(null);
  const [lastServerAckAt, setLastServerAckAt] = useState<number | null>(null);

  const canUseGeolocation = useMemo(
    () => typeof window !== 'undefined' && !!navigator.geolocation,
    []
  );

  const stop = useCallback(() => {
    if (watchIdRef.current !== null && canUseGeolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState('idle');
  }, [canUseGeolocation]);

  const sendToServer = useCallback(
    async (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastSentAtRef.current < minIntervalMs) return;

      lastSentAtRef.current = now;

      const res = await fetch('/api/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, orderId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update location');
      }

      setLastServerAckAt(Date.now());
    },
    [orderId, minIntervalMs]
  );

  const start = useCallback(async () => {
    if (!canUseGeolocation) {
      toast.error('Geolocation is not supported on this device/browser.');
      setState('error');
      return;
    }

    setState('starting');

    try {
      // Start watching
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          setLastLocation({
            lat,
            lng,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          });

          try {
            await sendToServer(lat, lng);
          } catch (e: any) {
            // Don’t spam toasts; keep it quiet after first
            console.error(e);
          }

          setState('sharing');
        },
        (err) => {
          console.error('Geolocation error:', err);
          toast.error(err.message || 'Location permission denied');
          setState('error');
          stop();
        },
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 15000,
        }
      );

      toast.success('Location sharing started');
    } catch (e: any) {
      toast.error(e.message || 'Failed to start location sharing');
      setState('error');
    }
  }, [canUseGeolocation, sendToServer, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    state,
    canUseGeolocation,
    lastLocation,
    lastServerAckAt,
    start,
    stop,
  };
}
EOF

  log_success "useLocationSharing hook created"
}

create_delivery_location_ui() {
  log_step "Phase 8: Creating Delivery Location Sharing UI"

  mkdir -p src/components/delivery

  cat > src/components/delivery/LocationSharingCard.tsx << 'EOF'
'use client';

import React from 'react';
import { MapPin, Wifi, WifiOff } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { useLocationSharing } from '@/hooks/useLocationSharing';

export function LocationSharingCard({ orderId }: { orderId?: string }) {
  const {
    state,
    canUseGeolocation,
    lastLocation,
    lastServerAckAt,
    start,
    stop,
  } = useLocationSharing({ orderId, minIntervalMs: 4000 });

  const statusBadge = () => {
    switch (state) {
      case 'sharing':
        return <Badge variant="success">Sharing</Badge>;
      case 'starting':
        return <Badge variant="warning">Starting…</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      default:
        return <Badge variant="default">Off</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            Location Sharing
          </span>
          {statusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canUseGeolocation && (
          <div className="text-sm text-red-600">
            Geolocation is not supported in this browser/device.
          </div>
        )}

        <div className="text-sm text-gray-600">
          {lastLocation ? (
            <div className="space-y-1">
              <div>
                <span className="text-gray-500">Lat:</span> {lastLocation.lat.toFixed(6)}{' '}
                <span className="text-gray-500 ml-2">Lng:</span> {lastLocation.lng.toFixed(6)}
              </div>
              {typeof lastLocation.accuracy === 'number' && (
                <div className="text-xs text-gray-500">
                  Accuracy: ±{Math.round(lastLocation.accuracy)}m
                </div>
              )}
              {lastServerAckAt && (
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-green-600" />
                  Server updated {Math.round((Date.now() - lastServerAckAt) / 1000)}s ago
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              No location sent yet
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={start}
            disabled={!canUseGeolocation || state === 'starting' || state === 'sharing'}
          >
            Start Sharing
          </Button>
          <Button
            variant="secondary"
            onClick={stop}
            disabled={state !== 'sharing' && state !== 'starting'}
          >
            Stop
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          This will periodically send your GPS to the backend and attach it to your active order (picked up / on the way).
        </p>
      </CardContent>
    </Card>
  );
}
EOF

  log_success "LocationSharingCard created"
}

#==============================================================================
# PHASE 5: Delivery Active Page update
#==============================================================================

update_delivery_active_page() {
  log_step "Phase 9: Updating /active page to show location sharing"

  mkdir -p "src/app/(delivery)/active"

  cat > "src/app/(delivery)/active/page.tsx" << 'EOF'
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
                <Badge variant="info">{String(activeOrder.status).replace('_', ' ')}</Badge>
              </div>

              <div className="text-sm text-gray-700">
                Deliver to: {activeOrder.deliveryAddress?.street}, {activeOrder.deliveryAddress?.city}
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
                    `${activeOrder.deliveryAddress?.street}, ${activeOrder.deliveryAddress?.city}, ${activeOrder.deliveryAddress?.state} ${activeOrder.deliveryAddress?.zipCode}`
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
EOF

  log_success "/active updated"
}

#==============================================================================
# PHASE 6: Fix TrackingMap (if present) to be safe by default
#==============================================================================

fix_tracking_map_if_present() {
  log_step "Phase 10: Fix TrackingMap (if present) to avoid runtime issues"

  if [ -f "src/components/map/TrackingMap.tsx" ]; then
    cat > src/components/map/TrackingMap.tsx << 'EOF'
'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });

interface TrackingMapProps {
  orderId: string;
  center: [number, number]; // [lat, lng]
  zoom?: number;
}

// Minimal Leaflet map: destination marker only.
// Customer live marker updates comes Day 18 (polling / maps).
export function TrackingMap({ orderId, center, zoom = 14 }: TrackingMapProps) {
  return (
    <div className="h-[420px] w-full rounded-xl overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">Delivery location</div>
              <div className="text-gray-600">Order: {orderId}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
EOF
    log_success "TrackingMap stabilized"
  else
    log_info "TrackingMap not present; skipping."
  fi
}

#==============================================================================
# PHASE 7: Verify + Commit
#==============================================================================

verify_setup() {
  log_step "Phase 11: Verification"

  local files=(
    "src/app/api/location/route.ts"
    "src/hooks/useLocationSharing.ts"
    "src/components/delivery/LocationSharingCard.tsx"
    "src/app/(delivery)/active/page.tsx"
    "src/app/api/orders/tracking/[orderNumber]/route.ts"
    "src/hooks/index.ts"
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
    log_success "All Day 17 files present!"
  else
    log_warning "Some files are missing."
  fi
}

git_commit() {
  log_step "Phase 12: Git Commit"

  if [ -d ".git" ]; then
    git add .
    git commit -m "Day 17: Location sharing

- Added /api/location to store driver GPS in User.lastLocation
- Attached driver GPS to active order via Order.deliveryLocation
- Created useLocationSharing hook using Geolocation watchPosition
- Added LocationSharingCard UI for delivery active page
- Stabilized tracking API/page and (optionally) TrackingMap
- Fixed hooks index exports"
    log_success "Committed changes!"
  else
    log_warning "Not a git repository, skipping commit"
  fi
}

show_completion() {
  log_step "✅ Day 17 Complete!"
  echo ""
  echo -e "${YELLOW}What you can do now:${NC}"
  echo "  • Delivery partner opens /active and clicks Start Sharing"
  echo "  • Driver GPS is saved in MongoDB: User.lastLocation"
  echo "  • Active order gets updated: Order.deliveryLocation"
  echo ""
  echo -e "${YELLOW}APIs:${NC}"
  echo "  • PUT /api/location   { lat, lng, orderId? }   (delivery-only)"
  echo "  • GET /api/location   (delivery-only)"
  echo ""
  echo -e "${YELLOW}Next (Day 18):${NC}"
  echo "  • Customer map tracking (live marker updates via polling)"
  echo ""
}

main() {
  show_banner
  verify_project
  install_leaflet_if_needed
  fix_hooks_index
  fix_customer_tracking_page_if_present
  fix_tracking_api_if_missing
  create_location_api
  create_location_hook
  create_delivery_location_ui
  update_delivery_active_page
  fix_tracking_map_if_present
  verify_setup
  git_commit
  show_completion
}

main
