import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdminRole, isRouteAllowed, hasRole } from '@/lib/rbac';

export interface AdminInfo {
  id: string;
  name: string | null;
  email: string | null;
  role: AdminRole | null;
}

interface AdminState {
  role: AdminRole | null;
  adminInfo: AdminInfo | null;
  setAdminInfo: (info: AdminInfo) => void;
  clearAdminInfo: () => void;
  // Utility checkers in the store context
  checkRouteAllowed: (pathname: string) => boolean;
  checkHasRole: (allowedRoles: AdminRole[]) => boolean;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      role: null,
      adminInfo: null,
      setAdminInfo: (info) => set({ role: info.role, adminInfo: info }),
      clearAdminInfo: () => set({ role: null, adminInfo: null }),
      checkRouteAllowed: (pathname) => {
        return isRouteAllowed(get().role, pathname);
      },
      checkHasRole: (allowedRoles) => {
        return hasRole(get().role, allowedRoles);
      }
    }),
    {
      name: 'bean-club-admin-store'
    }
  )
);
