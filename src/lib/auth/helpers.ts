import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './options';

// =============================================================================
// Server-Side Auth Helpers
// =============================================================================

/**
 * Get the current session on the server
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user from session
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

/**
 * Check if user is authenticated (server-side)
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  return session.user;
}

/**
 * Check if user has specific role (server-side)
 */
export async function requireRole(allowedRoles: string | string[]) {
  const user = await requireAuth();

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    redirect('/unauthorized');
  }

  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin() {
  return requireRole('admin');
}

/**
 * Require delivery role
 */
export async function requireDelivery() {
  return requireRole('delivery');
}

/**
 * Require customer role
 */
export async function requireCustomer() {
  return requireRole('customer');
}

export { getRedirectPath } from './utils';
