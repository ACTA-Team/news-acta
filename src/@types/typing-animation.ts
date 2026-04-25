import type { DOMMotionComponents, MotionProps } from 'motion/react';

/** Keys we allow for `as` on TypingAnimation (matches motion DOM map in the component). */
export type TypingAnimationElement = Extract<
  keyof DOMMotionComponents,
  'article' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'li' | 'p' | 'section' | 'span'
>;

/** State machine input — used by {@link useTypingAnimation} (no `motion` props). */
export type TypingAnimationBehavior = {
  children?: string;
  words?: string[];
  duration?: number;
  typeSpeed?: number;
  deleteSpeed?: number;
  delay?: number;
  pauseDelay?: number;
  loop?: boolean;
  as?: TypingAnimationElement;
  startOnView?: boolean;
  showCursor?: boolean;
  blinkCursor?: boolean;
  cursorStyle?: 'line' | 'block' | 'underscore';
};

/**
 * Public props for the {@link TypingAnimation} component.
 */
export type TypingAnimationProps = Omit<MotionProps, 'children'> & TypingAnimationBehavior & {
  className?: string;
};
