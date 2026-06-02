'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useInView } from 'motion/react';

import type { TypingAnimationBehavior, TypingAnimationElement } from '@/@types/typing-animation';

type Phase = 'typing' | 'pause' | 'deleting';

export type TypingAnimationViewModel = {
  displayedText: string;
  shouldShowCursor: boolean;
  getCursorChar: () => string;
  elementRef: RefObject<HTMLElement | null>;
  blinkCursor: boolean;
};

/**
 * Typing / deleting loop for {@link TypingAnimation}. Presentation stays in the component (motion + cursor span).
 */
export function useTypingAnimation(
  params: TypingAnimationBehavior & { as: TypingAnimationElement }
): TypingAnimationViewModel {
  const {
    children,
    words,
    duration = 100,
    typeSpeed,
    deleteSpeed,
    delay = 0,
    pauseDelay = 1000,
    loop = false,
    startOnView = true,
    showCursor = true,
    blinkCursor = true,
    cursorStyle = 'line',
  } = params;
  const [displayedText, setDisplayedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');
  const elementRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(elementRef as RefObject<Element | null>, {
    amount: 0.3,
    once: true,
  });

  const wordsToAnimate = useMemo(() => words ?? (children ? [children] : []), [words, children]);
  const hasMultipleWords = wordsToAnimate.length > 1;
  const typingSpeed = typeSpeed ?? duration;
  const deletingSpeed = deleteSpeed ?? typingSpeed / 2;
  const shouldStart = startOnView ? isInView : true;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (shouldStart && wordsToAnimate.length > 0) {
      const timeoutDelay =
        delay > 0 && displayedText === ''
          ? delay
          : phase === 'typing'
            ? typingSpeed
            : phase === 'deleting'
              ? deletingSpeed
              : pauseDelay;

      timeout = setTimeout(() => {
        const currentWord = wordsToAnimate[currentWordIndex] || '';
        const graphemes = Array.from(currentWord);

        switch (phase) {
          case 'typing':
            if (currentCharIndex < graphemes.length) {
              setDisplayedText(graphemes.slice(0, currentCharIndex + 1).join(''));
              setCurrentCharIndex(currentCharIndex + 1);
            } else {
              if (hasMultipleWords || loop) {
                const isLastWord = currentWordIndex === wordsToAnimate.length - 1;
                if (!isLastWord || loop) {
                  setPhase('pause');
                }
              }
            }
            break;

          case 'pause':
            setPhase('deleting');
            break;

          case 'deleting':
            if (currentCharIndex > 0) {
              setDisplayedText(graphemes.slice(0, currentCharIndex - 1).join(''));
              setCurrentCharIndex(currentCharIndex - 1);
            } else {
              const nextIndex = (currentWordIndex + 1) % wordsToAnimate.length;
              setCurrentWordIndex(nextIndex);
              setPhase('typing');
            }
            break;
        }
      }, timeoutDelay);
    }

    return () => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
    };
  }, [
    shouldStart,
    phase,
    currentCharIndex,
    currentWordIndex,
    displayedText,
    wordsToAnimate,
    hasMultipleWords,
    loop,
    typingSpeed,
    deletingSpeed,
    pauseDelay,
    delay,
  ]);

  const currentWordGraphemes = Array.from(wordsToAnimate[currentWordIndex] || '');
  const isComplete =
    !loop &&
    currentWordIndex === wordsToAnimate.length - 1 &&
    currentCharIndex >= currentWordGraphemes.length &&
    phase !== 'deleting';

  const shouldShowCursor =
    showCursor &&
    !isComplete &&
    (hasMultipleWords || loop || currentCharIndex < currentWordGraphemes.length);

  const getCursorChar = () => {
    switch (cursorStyle) {
      case 'block':
        return '▌';
      case 'underscore':
        return '_';
      case 'line':
      default:
        return '|';
    }
  };

  return {
    displayedText,
    shouldShowCursor: Boolean(shouldShowCursor),
    getCursorChar,
    elementRef,
    blinkCursor,
  };
}
