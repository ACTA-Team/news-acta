'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MediaItem } from '@/@types/media';
import { ImagePickerModal } from './ImagePickerModal';
import { buildPublicUrl } from './utils';

interface CoverImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

/**
 * Replaces the raw URL text input for cover images.
 * Shows a thumbnail preview and opens the ImagePickerModal on click.
 */
export function CoverImagePicker({ value, onChange, label = 'Cover Image' }: CoverImagePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  function handleSelect(item: MediaItem, url: string) {
    onChange(url);
    setShowPicker(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>

      <div className="flex items-start gap-3">
        {/* Preview */}
        {value ? (
          <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
            <Image
              src={value}
              alt="Cover image preview"
              fill
              className="object-cover"
              sizes="128px"
            />
          </div>
        ) : (
          <div className="flex h-20 w-32 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900 text-xs text-zinc-600">
            No image
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
          >
            {value ? 'Change image' : 'Select image'}
          </button>

          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-red-500 hover:text-red-400 transition-colors"
            >
              Remove
            </button>
          )}

          {value && (
            <p className="max-w-xs truncate text-xs text-zinc-600" title={value}>
              {value}
            </p>
          )}
        </div>
      </div>

      {showPicker && (
        <ImagePickerModal
          defaultBucket="article-covers"
          preferVariant="lg"
          onSelect={handleSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
