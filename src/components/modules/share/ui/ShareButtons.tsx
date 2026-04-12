'use client';

import { useState } from 'react';
import { siteConfig } from '@/config/site';
import {
  buildXShareUrl,
  buildLinkedInShareUrl,
  buildInstagramShareUrl,
} from '@/components/modules/share/utils/shareUrls';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
}

/**
 * Share button row. Client Component because it uses clipboard + local state.
 * Content-agnostic: it takes URL and title via props.
 */
export function ShareButtons({
  url,
  title,
  description,
  hashtags,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const target = {
    url,
    title,
    description,
    hashtags,
    via: siteConfig.social.x.handle,
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop: the user can still copy the link manually */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
        Share
      </span>

      <a
        href={buildXShareUrl(target)}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      >
        X
      </a>

      <a
        href={buildLinkedInShareUrl(target)}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      >
        LinkedIn
      </a>

      <button
        type="button"
        onClick={() => handleCopy(buildInstagramShareUrl(target))}
        className="rounded-full border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      >
        Instagram
      </button>

      <button
        type="button"
        onClick={() => handleCopy(url)}
        className="rounded-full border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}
