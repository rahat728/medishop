'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  MapPin,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/medicines', label: 'Medicines', icon: Package },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/delivery-men', label: 'Delivery Men', icon: Users },
  { href: '/tracking', label: 'Live Tracking', icon: MapPin },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen">
      <div className="p-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <div>
            <span className="font-bold text-lg text-gray-900">MedDelivery</span>
            <span className="block text-xs text-gray-500">Admin Panel</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
