'use client';

import { useMemo, type ComponentType, type RefAttributes } from 'react';
import { motion, type HTMLMotionProps, type MotionProps } from 'motion/react';

import type { TypingAnimationProps } from '@/@types/typing-animation';
import { useTypingAnimation } from '@/hooks/useTypingAnimation';
import { cn } from '@/lib/utils';

const motionElements = {
  article: motion.article,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
  li: motion.li,
  p: motion.p,
  section: motion.section,
  span: motion.span,
} as const;

type TypingAnimationMotionComponent = ComponentType<
  Omit<HTMLMotionProps<'span'>, 'ref'> & RefAttributes<HTMLElement>
>;

/**
 * State reset when `words` / `children` change is done by remounting via `key` on the
 * public `TypingAnimation` wrapper (avoids setState in an effect; satisfies react-hooks).
 */
function TypingAnimationImpl({
  children,
  words,
  className,
  duration = 100,
  typeSpeed,
  deleteSpeed,
  delay = 0,
  pauseDelay = 1000,
  loop = false,
  as: Component = 'span',
  startOnView = true,
  showCursor = true,
  blinkCursor = true,
  cursorStyle = 'line',
  ...motionProps
}: TypingAnimationProps) {
  const MotionComponent = motionElements[Component] as TypingAnimationMotionComponent;

  const {
    displayedText,
    shouldShowCursor,
    getCursorChar,
    elementRef,
    blinkCursor: blink,
  } = useTypingAnimation({
    children,
    words,
    duration,
    typeSpeed,
    deleteSpeed,
    delay,
    pauseDelay,
    loop,
    as: Component,
    startOnView,
    showCursor,
    blinkCursor,
    cursorStyle,
  });

  return (
    <MotionComponent
      ref={elementRef}
      className={cn(
        'leading-20 tracking-[-0.02em]',
        Component === 'span' && 'inline-block',
        className
      )}
      {...(motionProps as MotionProps)}
    >
      {displayedText}
      {shouldShowCursor && (
        <span className={cn('inline-block', blink && 'animate-blink-cursor')}>
          {getCursorChar()}
        </span>
      )}
    </MotionComponent>
  );
}

export function TypingAnimation(props: TypingAnimationProps) {
  const animationKey = useMemo(
    () => (props.words ? props.words.join('\u0000') : (props.children ?? '')),
    [props.words, props.children]
  );
  return <TypingAnimationImpl key={animationKey} {...props} />;
}
