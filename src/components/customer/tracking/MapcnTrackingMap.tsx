'use client';

import React, { useMemo } from 'react';
import { Map, Marker, MapControls } from '@/components/maps/map';

export function MapcnTrackingMap({
    destination,
    driver,
}: {
    destination: { lat: number; lng: number } | null;
    driver: { lat: number; lng: number } | null;
}) {
    const center: [number, number] = useMemo(() => {
        if (driver) return [driver.lng, driver.lat];
        if (destination) return [destination.lng, destination.lat];
        return [-74.0060, 40.7128]; // fallback NYC
    }, [driver, destination]);

    return (
        <div className="h-[420px] w-full rounded-xl overflow-hidden border border-gray-200">
            <Map
                center={center}
                zoom={14}
            >
                <MapControls position="bottom-right" />

                {destination && (
                    <Marker longitude={destination.lng} latitude={destination.lat}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg border-2 border-white font-bold">
                            D
                        </div>
                    </Marker>
                )}

                {driver && (
                    <Marker longitude={driver.lng} latitude={driver.lat}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl shadow-xl border-2 border-blue-100 animate-bounce">
                            🚚
                        </div>
                    </Marker>
                )}
            </Map>
        </div>
    );
}
