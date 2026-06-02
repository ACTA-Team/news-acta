'use client';

import { TypingAnimation } from '@/components/ui/TypingAnimation';
import { cn } from '@/lib/utils';

type HomeHeroTypingTitleProps = {
  line: string;
  className?: string;
};

export function HomeHeroTypingTitle({ line, className }: HomeHeroTypingTitleProps) {
  return (
    <TypingAnimation
      as="h1"
      aria-label={line}
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
      loop={false}
    >
      {line}
    </TypingAnimation>
  );
}
