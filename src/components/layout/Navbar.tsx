'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Menu, 
  X, 
  ShoppingCart, 
  User, 
  Package,
  LogOut,
  LayoutDashboard
} from 'lucide-react';

// This will be replaced with actual auth in Day 3
const mockUser = null; // Change to test different states
// const mockUser = { name: 'John', role: 'customer' };
// const mockUser = { name: 'Admin', role: 'admin' };
// const mockUser = { name: 'Driver', role: 'delivery' };

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const user = mockUser as { name: string; role: string } | null;

  const getRoleBasedLinks = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'admin':
        return [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/medicines', label: 'Medicines', icon: Package },
          { href: '/orders', label: 'Orders', icon: Package },
        ];
      case 'delivery':
        return [
          { href: '/my-orders', label: 'My Orders', icon: Package },
          { href: '/active', label: 'Active Delivery', icon: Package },
        ];
      default: // customer
        return [
          { href: '/shop', label: 'Shop', icon: Package },
          { href: '/orders', label: 'My Orders', icon: Package },
        ];
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-bold text-xl text-gray-900">MedDelivery</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {getRoleBasedLinks().map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-600 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                
                {user.role === 'customer' && (
                  <Link
                    href="/cart"
                    className="relative text-gray-600 hover:text-primary-500 p-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      0
                    </span>
                  </Link>
                )}
                
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                  <span className="text-sm text-gray-600">{user.name}</span>
                  <button className="text-gray-600 hover:text-red-500 p-2">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/shop"
                  className="text-gray-600 hover:text-primary-500 px-3 py-2 text-sm font-medium"
                >
                  Shop
                </Link>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-primary-500 px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                {getRoleBasedLinks().map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <Link
                  href="/shop"
                  className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  Shop
                </Link>
                <Link
                  href="/login"
                  className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 text-primary-500 font-medium hover:bg-gray-50 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
