'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  Navigation,
  User,
  LogOut,
  Menu,
  X,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/hooks';

interface DeliveryNavbarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
  };
}

const navItems = [
  { href: '/my-orders', label: 'My Orders', icon: Package },
  { href: '/active', label: 'Active Delivery', icon: Navigation },
];

export function DeliveryNavbar({ user }: DeliveryNavbarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/my-orders" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div>
                  <span className="font-bold text-lg text-gray-900">MedicineShop</span>
                  <span className="hidden sm:block text-xs text-gray-500">Delivery Partner</span>
                </div>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}

              {/* User Menu */}
              <div className="relative ml-4 pl-4 border-l border-gray-200">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-green-600" />
                  </div>
                  <span>{user.name}</span>
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          <MapPin className="w-3 h-3" />
                          Delivery Partner
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-600"
              >
                {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMenu(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-gray-100 py-2">
              <button
                onClick={() => {
                  setShowMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600"
              >
                <LogOut className="w-5 h-5" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-3 px-4 text-xs font-medium ${isActive ? 'text-primary-600' : 'text-gray-500'
                  }`}
              >
                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
