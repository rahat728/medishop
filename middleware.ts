import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { env } from '@/lib/env';

// =============================================================================
// Route Configuration
// =============================================================================

// Routes that require authentication
const protectedRoutes = [
  '/shop',
  '/cart',
  '/checkout',
  '/orders',
  '/track',
  '/dashboard',
  '/admin/medicines',
  '/admin/delivery-men',
  '/admin/tracking',
  '/admin/orders',
  '/my-orders',
  '/active',
];

// Routes that require specific roles
const roleRoutes: Record<string, string[]> = {
  // Admin only routes
  '/dashboard': ['admin'],
  '/admin/medicines': ['admin'],
  '/admin/delivery-men': ['admin'],
  '/admin/tracking': ['admin'],
  '/admin/orders': ['admin'],

  // Delivery only routes
  '/my-orders': ['delivery'],
  '/active': ['delivery'],

  // Customer only routes
  '/cart': ['customer'],
  '/checkout': ['customer'],

  // Multiple roles allowed
  '/orders': ['customer'],
  '/shop': ['customer', 'admin'], // Admin can view shop too
};

// Public routes (no auth required)
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/api/auth',
  '/unauthorized',
];

// =============================================================================
// Middleware Function
// =============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  // 1. Skip middleware for static assets, public folder, and well-known files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/stripe/webhook') || // Handled internally with signature verification
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 3. Get the token with validated secret
  const token = await getToken({
    req: request,
    secret: env.NEXTAUTH_SECRET,
  });

  // 4. Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // 5. Redirect to login if not authenticated
  if (isProtectedRoute && !token) {
    console.warn(`🔐 Unauthorized access attempt to ${pathname} from ${ip}`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Check role-based access
  if (token) {
    const userRole = (token.role as string) || 'customer';

    // Find matching role route
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        if (!allowedRoles.includes(userRole)) {
          console.error(`🚫 Role mismatch: User ${token.email} (${userRole}) attempted to access ${pathname}`);
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        break;
      }
    }
  }

  return NextResponse.next();
}

// =============================================================================
// Middleware Config
// =============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
