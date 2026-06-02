'use client';

import { useEffect } from 'react';

export function ThemeInit() {
  useEffect(() => {
    try {
      const t = localStorage.getItem('theme');
      const isDark =
        t === 'dark' ||
        (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    } catch {}
  }, []);

  return null;
}
