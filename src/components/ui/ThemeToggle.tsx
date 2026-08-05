// src/components/ui/ThemeToggle.tsx
'use client';

import { useTheme } from '@/components/theme-provider';
import { Sun, Moon } from 'lucide-react';
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

const getClientSnapshot = () => true;

const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!mounted) {
    return null;
  }

  const toggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-md hover:bg-muted transition"
      aria-label="تبديل المظهر"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}