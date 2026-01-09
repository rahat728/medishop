import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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
  console.log(`🌐 [Middleware] Path: ${pathname}`);

  // Skip middleware for static files and API routes (except protected ones)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get the token
  let token = null;
  const cookieNames = request.cookies.getAll().map(c => c.name);
  console.log(`🌐 [Middleware] Path: ${pathname} | Cookies found: [${cookieNames.join(', ')}]`);

  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production' || pathname.startsWith('https') || request.headers.get('x-forwarded-proto') === 'https',
    });
    if (!process.env.NEXTAUTH_SECRET) {
      console.warn('⚠️ [Middleware] NEXTAUTH_SECRET is not defined!');
    }
  } catch (error) {
    console.error('🔥 [Middleware] Error getting token:', error);
  }

  console.log(`🌐 [Middleware] Path: ${pathname} | Token:`, token ? `Found (role: ${token.role})` : 'NULL');

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Redirect to login if not authenticated
  if (isProtectedRoute && !token) {
    console.log(`📡 [Middleware] Redirecting ${pathname} to /login (Not Authenticated)`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  if (token) {
    const userRole = token.role as string;

    // Find matching role route
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        if (!allowedRoles.includes(userRole)) {
          // Redirect to unauthorized or appropriate page
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
