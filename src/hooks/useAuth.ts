'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { getRedirectPath } from '@/lib/auth';

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;

  // Login function
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          toast.error(result.error);
          return { success: false, error: result.error };
        }

        toast.success('Welcome back!');
        
        // Get session to determine redirect
        const response = await fetch('/api/auth/session');
        const sessionData = await response.json();
        
        if (sessionData?.user?.role) {
          const redirectPath = getRedirectPath(sessionData.user.role);
          router.push(redirectPath);
        } else {
          router.push('/shop');
        }

        return { success: true };
      } catch (error: any) {
        const message = error.message || 'Login failed';
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [router]
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  }, [router]);

  // Check role
  const hasRole = useCallback(
    (roles: string | string[]) => {
      if (!user?.role) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    [user?.role]
  );

  return {
    user,
    session,
    status,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    isAdmin: user?.role === 'admin',
    isDelivery: user?.role === 'delivery',
    isCustomer: user?.role === 'customer',
    updateSession: update,
  };
}
