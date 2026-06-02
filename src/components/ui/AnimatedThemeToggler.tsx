'use client';

import { Moon, Sun } from 'lucide-react';

import type { AnimatedThemeTogglerProps } from '@/@types/animated-theme-toggler';
import { useHtmlDarkClassSync } from '@/hooks/useHtmlDarkClassSync';
import { useViewTransitionThemeToggle } from '@/hooks/useViewTransitionThemeToggle';
import { cn } from '@/lib/utils';

export type { TransitionVariant } from '@/@types/animated-theme-toggler';

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  variant,
  fromCenter = false,
  ...props
}: AnimatedThemeTogglerProps) => {
  const shape = variant ?? 'circle';
  const isDark = useHtmlDarkClassSync();
  const { buttonRef, toggleTheme } = useViewTransitionThemeToggle({
    duration,
    shape,
    fromCenter,
  });

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
      {...props}
    >
      {isDark ? <Sun /> : <Moon />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
