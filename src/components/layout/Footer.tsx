'use client';

import React from 'react';
import Link from 'next/link';
import NextImage from 'next/image';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <NextImage
                src="/logo.png"
                alt="Medishop"
                width={150}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-gray-600 text-sm">
              Your trusted OTC medicine delivery service. Fast, reliable, and always there when you need us.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="text-gray-600 hover:text-primary-500 text-sm">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-gray-600 hover:text-primary-500 text-sm">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-primary-500 text-sm">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Categories</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shop?category=pain-relief" className="text-gray-600 hover:text-primary-500 text-sm">
                  Pain Relief
                </Link>
              </li>
              <li>
                <Link href="/shop?category=cold-flu" className="text-gray-600 hover:text-primary-500 text-sm">
                  Cold & Flu
                </Link>
              </li>
              <li>
                <Link href="/shop?category=vitamins" className="text-gray-600 hover:text-primary-500 text-sm">
                  Vitamins
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>support@medishop.com</li>
              <li>+1 (555) 123-4567</li>
              <li>Mon - Sat: 8am - 10pm</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-8 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Medishop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
