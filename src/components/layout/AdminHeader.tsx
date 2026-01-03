'use client';

import React, { useState } from 'react';
import { Bell, Search, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks';

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
    const { user, logout } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const notifications = [
        { id: 1, title: 'New order received', time: '5 min ago', unread: true },
        { id: 2, title: 'Low stock alert: Ibuprofen', time: '1 hour ago', unread: true },
        { id: 3, title: 'Delivery completed', time: '2 hours ago', unread: false },
    ];

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
            <div className="flex items-center justify-between px-6 py-4">
                {/* Title Section */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>

                {/* Actions & User Section */}
                <div className="flex items-center gap-4">
                    {/* Custom Actions */}
                    {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowNotifications(false)}
                                />
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-20">
                                    <div className="p-4 border-b border-gray-100">
                                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${notification.unread ? 'bg-primary-50/50' : ''
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {notification.unread && (
                                                        <span className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                                                    )}
                                                    <div className={notification.unread ? '' : 'ml-5'}>
                                                        <p className="text-sm text-gray-900">{notification.title}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t border-gray-100">
                                        <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
                                            View all notifications
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-primary-600 font-medium text-sm">
                                    {user?.name?.charAt(0) || 'A'}
                                </span>
                            </div>
                            <span className="hidden sm:block text-sm font-medium text-gray-700">
                                {user?.name}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        {showUserMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowUserMenu(false)}
                                />
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-20">
                                    <div className="p-4 border-b border-gray-100">
                                        <p className="font-medium text-gray-900">{user?.name}</p>
                                        <p className="text-sm text-gray-500">{user?.email}</p>
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full capitalize">
                                            {user?.role}
                                        </span>
                                    </div>
                                    <div className="py-2">
                                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            <User className="w-4 h-4" />
                                            Profile
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </button>
                                    </div>
                                    <div className="border-t border-gray-100 py-2">
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                logout();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
