import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { errorResponse, unauthorizedResponse, forbiddenResponse, ApiErrorResponse } from '@/lib/api-response';

// =============================================================================
// API Route Protection Helpers
// =============================================================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Get authenticated user from request
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return null;
  }

  return {
    id: token.id as string,
    email: token.email as string,
    name: token.name as string,
    role: token.role as string,
  };
}

/**
 * Require authentication for API route
 */
export async function requireApiAuth(
  request: NextRequest
): Promise<{ user: AuthUser } | { error: NextResponse }> {
  const user = await getAuthUser(request);

  if (!user) {
    return { error: unauthorizedResponse('Authentication required') };
  }

  return { user };
}

/**
 * Require specific role(s) for API route
 */
export async function requireApiRole(
  request: NextRequest,
  allowedRoles: string | string[]
): Promise<{ user: AuthUser } | { error: NextResponse }> {
  const result = await requireApiAuth(request);

  if ('error' in result) {
    return result;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(result.user.role)) {
    return { error: forbiddenResponse('Insufficient permissions') };
  }

  return { user: result.user };
}

/**
 * Require admin role for API route
 */
export async function requireApiAdmin(
  request: NextRequest
): Promise<{ user: AuthUser } | { error: NextResponse }> {
  return requireApiRole(request, 'admin');
}

/**
 * Require delivery role for API route
 */
export async function requireApiDelivery(
  request: NextRequest
): Promise<{ user: AuthUser } | { error: NextResponse }> {
  return requireApiRole(request, 'delivery');
}

/**
 * Require customer role for API route
 */
export async function requireApiCustomer(
  request: NextRequest
): Promise<{ user: AuthUser } | { error: NextResponse }> {
  return requireApiRole(request, 'customer');
}

// =============================================================================
// Higher-Order Function for Protected API Routes
// =============================================================================

type ApiHandler<T = unknown> = (
  request: NextRequest,
  context: { user: AuthUser; params?: Record<string, string> }
) => Promise<NextResponse<T> | NextResponse<ApiErrorResponse>>;

/**
 * Wrap an API handler with authentication
 */
export function withAuth<T>(handler: ApiHandler<T>) {
  return async (request: NextRequest, context?: { params?: Promise<Record<string, string>> }) => {
    const result = await requireApiAuth(request);

    if ('error' in result) {
      return result.error;
    }

    const params = context?.params ? await context.params : undefined;
    return handler(request, { user: result.user, params });
  };
}

/**
 * Wrap an API handler with role-based authentication
 */
export function withRole<T>(roles: string | string[], handler: ApiHandler<T>) {
  return async (request: NextRequest, context?: { params?: Promise<Record<string, string>> }) => {
    const result = await requireApiRole(request, roles);

    if ('error' in result) {
      return result.error;
    }

    const params = context?.params ? await context.params : undefined;
    return handler(request, { user: result.user, params });
  };
}

/**
 * Wrap an API handler with admin authentication
 */
export function withAdmin<T>(handler: ApiHandler<T>) {
  return withRole('admin', handler);
}

/**
 * Wrap an API handler with delivery authentication
 */
export function withDelivery<T>(handler: ApiHandler<T>) {
  return withRole('delivery', handler);
}

/**
 * Wrap an API handler with customer authentication
 */
export function withCustomer<T>(handler: ApiHandler<T>) {
  return withRole('customer', handler);
}
