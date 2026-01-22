'use client';

import React, { useMemo } from 'react';
import { Map, Marker, Popup, MapControls } from '@/components/maps/map';

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

export function AdminMapcnTrackingMap({
    orders,
    selectedOrderId,
    onSelectOrder,
}: {
    orders: AdminTrackedOrder[];
    selectedOrderId: string | null;
    onSelectOrder: (orderId: string | null) => void;
}) {
    const selected = useMemo(
        () => orders.find((o) => o._id === selectedOrderId) || null,
        [orders, selectedOrderId]
    );

    const defaultCenter: [number, number] = useMemo(() => {
        const firstDriver = orders.find((o) => o.driverCoords)?.driverCoords;
        if (firstDriver) return [firstDriver.lng, firstDriver.lat];
        const firstDest = orders.find((o) => o.destinationCoords)?.destinationCoords;
        if (firstDest) return [firstDest.lng, firstDest.lat];
        return [-74.0060, 40.7128]; // fallback NYC
    }, [orders]);

    return (
        <div className="h-[520px] w-full rounded-xl overflow-hidden border border-gray-200">
            <Map
                center={
                    selected?.driverCoords
                        ? [selected.driverCoords.lng, selected.driverCoords.lat]
                        : selected?.destinationCoords
                            ? [selected.destinationCoords.lng, selected.destinationCoords.lat]
                            : defaultCenter
                }
                zoom={13}
            >
                <MapControls position="bottom-right" />

                {orders.map((o) => (
                    <React.Fragment key={o._id}>
                        {o.destinationCoords && (
                            <Marker
                                longitude={o.destinationCoords.lng}
                                latitude={o.destinationCoords.lat}
                                onClick={() => onSelectOrder(o._id)}
                            >
                                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] text-white font-bold shadow-md border border-white ${o._id === selectedOrderId ? 'bg-blue-800 scale-125' : 'bg-blue-600'}`}>
                                    D
                                </div>
                            </Marker>
                        )}

                        {o.driverCoords && (
                            <Marker
                                longitude={o.driverCoords.lng}
                                latitude={o.driverCoords.lat}
                                onClick={() => onSelectOrder(o._id)}
                            >
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-lg border border-gray-100 ${o._id === selectedOrderId ? 'scale-125 ring-2 ring-blue-500' : ''}`}>
                                    🚚
                                </div>
                            </Marker>
                        )}
                    </React.Fragment>
                ))}

                {selected && (selected.driverCoords || selected.destinationCoords) && (
                    <Popup
                        longitude={
                            selected.driverCoords
                                ? selected.driverCoords.lng
                                : selected.destinationCoords!.lng
                        }
                        latitude={
                            selected.driverCoords
                                ? selected.driverCoords.lat
                                : selected.destinationCoords!.lat
                        }
                        onClose={() => onSelectOrder(null)}
                        closeButton
                        className="z-50 min-w-[200px]"
                    >
                        <div className="text-sm p-1">
                            <div className="font-semibold">{selected.orderNumber}</div>
                            <div className="text-gray-700 capitalize">Status: {String(selected.status).replace('_', ' ')}</div>
                            <div className="text-gray-700 font-medium">Total: ${selected.totalAmount?.toFixed?.(2) ?? selected.totalAmount}</div>
                            <div className="mt-2 text-xs">
                                <div className="text-gray-600">Driver: {selected.deliveryMan?.name || 'Not assigned'}</div>
                                <div className="text-gray-600">Customer: {selected.customer?.name || 'Unknown'}</div>
                            </div>
                            {selected.driverCoords?.updatedAt && (
                                <div className="mt-2 text-[10px] text-gray-500 border-t pt-1">
                                    Updated: {new Date(selected.driverCoords.updatedAt).toLocaleString()}
                                </div>
                            )}
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
}
