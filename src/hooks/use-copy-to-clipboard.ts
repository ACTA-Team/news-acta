'use client';

import { useCallback, useState } from 'react';

/**
 * Reusable global hook to copy text to the clipboard with feedback.
 * Lives in `src/hooks` because it does not belong to any specific module.
 */
export function useCopyToClipboard(resetMs: number = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetMs]
  );

  return { copied, copy };
}
