'use client';

import { useAuth } from '@/hooks';
import { Shield, ShieldCheck, ShieldX } from 'lucide-react';

export function AuthStatus() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <span className="text-sm">Checking auth...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <ShieldX className="w-4 h-4" />
        <span className="text-sm">Not authenticated</span>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    admin: 'text-purple-600 bg-purple-100',
    delivery: 'text-green-600 bg-green-100',
    customer: 'text-blue-600 bg-blue-100',
  };

  return (
    <div className="flex items-center gap-3">
      <ShieldCheck className="w-4 h-4 text-green-600" />
      <span className="text-sm text-gray-700">{user?.name}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${roleColors[user?.role || ''] || 'bg-gray-100 text-gray-600'}`}>
        {user?.role}
      </span>
    </div>
  );
}
