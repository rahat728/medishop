'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Package,
  LogOut,
  LayoutDashboard,
  User,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/hooks';
import { CartIcon, CartDrawer } from '@/components/cart';
import { useCartStore } from '@/store';

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, isLoading, logout, isAdmin, isDelivery, isCustomer } = useAuth();
  const { toggleCart } = useCartStore();

  const getRoleBasedLinks = () => {
    if (!user) return [];

    if (isAdmin) {
      return [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/medicines', label: 'Medicines', icon: Package },
        { href: '/orders', label: 'Orders', icon: ShoppingBag },
      ];
    }

    if (isDelivery) {
      return [
        { href: '/my-orders', label: 'My Orders', icon: Package },
        { href: '/active', label: 'Active Delivery', icon: Package },
      ];
    }

    // Customer
    return [
      { href: '/shop', label: 'Shop', icon: Package },
      { href: '/orders', label: 'My Orders', icon: ShoppingBag },
    ];
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  // Don't show navbar on auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null;
  }

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
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
              {isLoading ? (
                <div className="h-8 w-32 bg-gray-100 animate-pulse rounded" />
              ) : isAuthenticated ? (
                <>
                  {getRoleBasedLinks().map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname.startsWith(link.href)
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-primary-500'
                        }`}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {/* Cart Icon (for customers) */}
                  {isCustomer && (
                    <CartIcon onClick={toggleCart} />
                  )}

                  {/* User Menu */}
                  <div className="relative ml-4 pl-4 border-l border-gray-200">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="hidden lg:block">{user?.name}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {showUserMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowUserMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full capitalize">
                              {user?.role}
                            </span>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign out
                          </button>
                        </div>
                      </>
                    )}
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

                  {/* Cart for guests */}
                  <CartIcon onClick={toggleCart} />

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
            <div className="md:hidden flex items-center gap-2">
              {/* Cart Icon (mobile) */}
              {(!isAuthenticated || isCustomer) && (
                <CartIcon onClick={toggleCart} />
              )}

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
              {isAuthenticated ? (
                <>
                  {/* User Info */}
                  <div className="px-3 py-2 mb-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>

                  {getRoleBasedLinks().map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-3 py-2 rounded-md ${pathname.startsWith(link.href)
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {isCustomer && (
                    <Link
                      href="/cart"
                      className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      Cart
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign out
                  </button>
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
                    href="/cart"
                    className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    Cart
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

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}
