export type AdminRole = 'superadmin' | 'admin' | 'kitchen';

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  superadmin: ['*'], // Access all routes
  admin: [
    '/dashboard/overview',
    '/dashboard/orders',
    '/dashboard/category',
    '/dashboard/product',
    '/dashboard/tag',
    '/dashboard/variant',
    '/dashboard/offers',
    '/dashboard/users',
    '/dashboard/loyalty-points',
    '/dashboard/settings',
    '/dashboard/feedback',
    '/dashboard/profile'
  ],
  kitchen: ['/dashboard/orders']
};

/**
 * Checks if a route is allowed for a specific admin role.
 */
export function isRouteAllowed(
  role: AdminRole | null | undefined,
  pathname: string
): boolean {
  if (!role) return false;
  const allowedRoutes = ROLE_PERMISSIONS[role];
  if (!allowedRoutes) return false;
  if (allowedRoutes.includes('*')) return true;

  // Check exact matches or sub-routes
  return allowedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Checks if the user role is authorized for a list of allowed roles.
 */
export function hasRole(
  userRole: AdminRole | null | undefined,
  allowedRoles: AdminRole[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
