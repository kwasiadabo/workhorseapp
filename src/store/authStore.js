import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// `accessToken` is intentionally NOT persisted — it lives in memory only and
// is re-acquired via `/auth/refresh` (httpOnly cookie) on page load.
const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isBootstrapping: true,

      setAuth: ({ user, accessToken }) => set({ user, accessToken, isAuthenticated: true }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setBootstrapped: () => set({ isBootstrapping: false }),

      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false, isBootstrapping: false }),

      hasRole: (...roles) => roles.includes(get().user?.role),

      hasPermission: (permission) => get().user?.permissions?.includes(permission) ?? false,

      // subscriptionStatus values: 'trialing' | 'active' | 'expired' | 'suspended' | 'cancelled' | null
      getSubscriptionStatus: () => get().user?.subscriptionStatus ?? null,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

export default useAuthStore;
