import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/sonner';
import useAuthStore from '@/store/authStore';
import { refresh } from '@/features/auth/auth.api';

function AuthBootstrapper({ children }) {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped);

  useEffect(() => {
    refresh()
      .then((data) => setAuth(data))
      .catch(() => clearAuth())
      .finally(() => setBootstrapped());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isBootstrapping) {
    return (
      <div className="flex h-svh items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return children;
}

export default function AppProviders({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrapper>{children}</AuthBootstrapper>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
