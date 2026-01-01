/**
 * Role-Based Redirect Paths
 * This file is client-safe and does not import any server-side libraries.
 */

export function getRedirectPath(role: string): string {
    switch (role) {
        case 'admin':
            return '/dashboard';
        case 'delivery':
            return '/my-orders';
        case 'customer':
        default:
            return '/shop';
    }
}
