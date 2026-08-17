'use client';

import { TypingAnimation } from '@/components/ui/TypingAnimation';
import { cn } from '@/lib/utils';

type HomeHeroTypingTitleProps = {
  /** Phrases to type, in order. Supplied by the dictionary, never hardcoded. */
  lines: string[];
  className?: string;
};

/**
 * The animated headline.
 *
 * With one phrase it types once and stops; with several it cycles. The static
 * `aria-label` is the first phrase, so assistive technology gets a stable
 * headline instead of a string that mutates character by character.
 */
export function HomeHeroTypingTitle({ lines, className }: HomeHeroTypingTitleProps) {
  const phrases = lines.filter((line) => line.trim().length > 0);
  if (phrases.length === 0) return null;

  const cycles = phrases.length > 1;

  return (
    <TypingAnimation
      as="h1"
      aria-label={phrases[0]}
      className={cn(
        'text-balance text-4xl font-medium leading-[1.1]! tracking-tight! text-foreground md:text-5xl',
        className
      )}
      typeSpeed={52}
      delay={160}
      startOnView
      showCursor
      blinkCursor
      cursorStyle="line"
      loop={cycles}
      {...(cycles ? { words: phrases } : { children: phrases[0] })}
    />
  );
}
