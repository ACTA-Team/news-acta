'use client';

import { useCallback, useRef, useState } from 'react';
import type { MediaBucket, MediaItem, UploadResponse } from '@/@types/media';
import { ALLOWED_MIME_TYPES, BUCKET_SIZE_LIMITS } from '@/lib/storage/constants';

interface UploadZoneProps {
  bucket: MediaBucket;
  anchorOnStellar?: boolean;
  onUploaded: (item: MediaItem, publicUrl: string) => void;
  onError?: (error: string) => void;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  fileName?: string;
}

export function UploadZone({
  bucket,
  anchorOnStellar = false,
  onUploaded,
  onError,
}: UploadZoneProps) {
  const [state, setState] = useState<UploadState>({ status: 'idle', progress: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      // Clear any pending reset timer from a previous upload
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      // Client-side validation
      const limitBytes = BUCKET_SIZE_LIMITS[bucket];
      if (file.size > limitBytes) {
        const msg = `File too large. Max ${(limitBytes / 1024 / 1024).toFixed(0)} MB for this bucket.`;
        setState({ status: 'error', progress: 0, error: msg });
        onError?.(msg);
        return;
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
        const msg = `File type "${file.type}" is not allowed.`;
        setState({ status: 'error', progress: 0, error: msg });
        onError?.(msg);
        return;
      }

      setState({ status: 'uploading', progress: 10, fileName: file.name });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('anchorOnStellar', String(anchorOnStellar));

      try {
        setState((s) => ({ ...s, progress: 30 }));

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        setState((s) => ({ ...s, progress: 80 }));

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? 'Upload failed');
        }

        const result: UploadResponse = await response.json();
        setState({ status: 'success', progress: 100, fileName: file.name });
        onUploaded(result.media, result.publicUrl);

        // Reset after a short delay — store timer so it can be cancelled
        resetTimerRef.current = setTimeout(() => {
          setState({ status: 'idle', progress: 0 });
          resetTimerRef.current = null;
        }, 2000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setState({ status: 'error', progress: 0, error: msg });
        onError?.(msg);
      }
    },
    [bucket, anchorOnStellar, onUploaded, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [uploadFile]
  );

  const isUploading = state.status === 'uploading';

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-950/20'
          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
      } ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(',')}
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Upload image file"
        disabled={isUploading}
      />

      {state.status === 'idle' && (
        <>
          <div className="mb-3 text-4xl text-zinc-600" aria-hidden>
            ↑
          </div>
          <p className="text-sm font-medium text-zinc-300">
            Drag & drop an image here, or{' '}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-blue-400 underline hover:text-blue-300"
            >
              browse
            </button>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            JPEG, PNG, WebP, GIF, SVG · Max {(BUCKET_SIZE_LIMITS[bucket] / 1024 / 1024).toFixed(0)}{' '}
            MB
          </p>
        </>
      )}

      {state.status === 'uploading' && (
        <div className="w-full max-w-xs">
          <p className="mb-2 text-sm text-zinc-300">Uploading {state.fileName}…</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${state.progress}%` }}
              role="progressbar"
              aria-valuenow={state.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {state.status === 'success' && (
        <p className="text-sm font-medium text-green-400">
          ✓ {state.fileName} uploaded successfully
        </p>
      )}

      {state.status === 'error' && (
        <div>
          <p className="text-sm font-medium text-red-400">Upload failed</p>
          <p className="mt-1 text-xs text-red-500">{state.error}</p>
          <button
            type="button"
            onClick={() => setState({ status: 'idle', progress: 0 })}
            className="mt-2 text-xs text-zinc-400 underline hover:text-zinc-200"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
