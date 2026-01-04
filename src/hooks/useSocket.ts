'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface DriverLocation {
  driverId: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('🔌 Connected to Socket.io server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Disconnected from Socket.io server');
      setIsConnected(false);
    });

    // Listen for driver location updates
    socketInstance.on('driver:location', (data: DriverLocation) => {
      console.log('📍 Received driver location update:', data);
      setDriverLocation(data);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    driverLocation,
  };
}
