'use client';

import { useState } from 'react';
import { siteConfig } from '@/config/site';
import { useTranslations } from '@/hooks/useTranslations';
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
 * Content-agnostic: it takes URL and title via props, and the caller is
 * responsible for passing a locale-correct canonical URL.
 */
export function ShareButtons({ url, title, description, hashtags }: ShareButtonsProps) {
  const { t } = useTranslations();
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
        {t('share.label')}
      </span>

      <a
        href={buildXShareUrl(target)}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      >
        {t('share.x')}
      </a>

      <a
        href={buildLinkedInShareUrl(target)}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      >
        {t('share.linkedin')}
      </a>

      <button
        type="button"
        onClick={() => handleCopy(buildInstagramShareUrl(target))}
        className="rounded-full border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      >
        {t('share.instagram')}
      </button>

      <button
        type="button"
        onClick={() => handleCopy(url)}
        className="rounded-full border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      >
        {copied ? t('share.copied') : t('share.copyLink')}
      </button>
    </div>
  );
}
