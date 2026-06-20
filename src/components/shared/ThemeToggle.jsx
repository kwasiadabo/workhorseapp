import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Simple light/dark toggle (not a 3-way system/light/dark menu) — once
// clicked it overrides the system preference next-themes started with, and
// persists via next-themes' own localStorage handling. No SSR in this app
// (pure client-rendered Vite), so there's no hydration mismatch to guard
// against — resolvedTheme is safe to read directly.
export default function ThemeToggle({ className }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn('shrink-0', className)}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
