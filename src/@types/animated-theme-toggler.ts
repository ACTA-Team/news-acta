import type { ComponentPropsWithoutRef } from 'react';

export type TransitionVariant =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'rectangle'
  | 'star';

export type AnimatedThemeTogglerProps = ComponentPropsWithoutRef<'button'> & {
  duration?: number;
  variant?: TransitionVariant;
  /** When true, the transition expands from the viewport center instead of the button center. */
  fromCenter?: boolean;
};
