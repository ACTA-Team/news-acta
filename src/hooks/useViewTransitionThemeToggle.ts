'use client';

import { useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';

import type { TransitionVariant } from '@/@types/animated-theme-toggler';
import { getThemeTransitionClipPaths } from '@/lib/theme/viewTransitionClipPaths';

type Options = {
  duration: number;
  /** Resolved shape (default applied by caller if undefined). */
  shape: TransitionVariant;
  fromCenter: boolean;
};

/**
 * View Transitions API–based theme flip from a button, with clip-path animation fallback math in {@link getThemeTransitionClipPaths}.
 */
export function useViewTransitionThemeToggle({ duration, shape, fromCenter }: Options) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const isDark = document.documentElement.classList.contains('dark');

    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    let x: number;
    let y: number;
    if (fromCenter) {
      x = viewportWidth / 2;
      y = viewportHeight / 2;
    } else {
      const { top, left, width, height } = button.getBoundingClientRect();
      x = left + width / 2;
      y = top + height / 2;
    }

    const maxRadius = Math.hypot(Math.max(x, viewportWidth - x), Math.max(y, viewportHeight - y));

    const applyTheme = () => {
      const newTheme = !isDark;
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    if (typeof document.startViewTransition !== 'function') {
      applyTheme();
      return;
    }

    const root = document.documentElement;
    root.dataset.magicuiThemeVt = 'active';
    root.style.setProperty('--magicui-theme-toggle-vt-duration', `${duration}ms`);
    const cleanup = () => {
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty('--magicui-theme-toggle-vt-duration');
    };

    const transition = document.startViewTransition(() => {
      flushSync(applyTheme);
    });
    if (typeof transition?.finished?.finally === 'function') {
      transition.finished.finally(cleanup);
    } else {
      cleanup();
    }

    const ready = transition?.ready;
    if (ready && typeof ready.then === 'function') {
      const clipPath = getThemeTransitionClipPaths(
        shape,
        x,
        y,
        maxRadius,
        viewportWidth,
        viewportHeight
      );
      ready.then(() => {
        document.documentElement.animate(
          {
            clipPath,
          },
          {
            duration,
            easing: shape === 'star' ? 'linear' : 'ease-in-out',
            fill: 'forwards',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });
    }
  }, [shape, fromCenter, duration]);

  return { buttonRef, toggleTheme };
}
