'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks';
import { Spinner } from '@/components/ui';

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: string | string[];
  fallback?: ReactNode;
  showLoader?: boolean;
}

export function RoleGate({
  children,
  allowedRoles,
  fallback = null,
  showLoader = true,
}: RoleGateProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading && showLoader) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
