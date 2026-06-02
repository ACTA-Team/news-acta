'use client';

import { useEffect, useState } from 'react';

/** Keeps React state in sync with `document.documentElement` `dark` class (e.g. theme toggles elsewhere). */
export function useHtmlDarkClassSync() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
