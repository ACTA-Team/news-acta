/**
 * POST /api/media/upload
 *
 * Accepts a multipart/form-data request with:
 *   - file: the image file
 *   - bucket: MediaBucket
 *   - anchorOnStellar: "true" | "false" (optional)
 *
 * Returns UploadResponse JSON.
 * Requires an admin session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadMedia } from '@/lib/storage/upload';
import { anchorHashOnStellar } from '@/lib/stellar/anchor';
import { updateStellarTxHash } from '@/lib/storage/media.service';
import type { MediaBucket } from '@/@types/media';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAdmin(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): boolean {
  return (
    user.app_metadata?.role === 'admin' ||
    user.user_metadata?.is_admin === true
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as MediaBucket | null;
    const anchorOnStellar = formData.get('anchorOnStellar') === 'true';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!bucket) return NextResponse.json({ error: 'No bucket specified' }, { status: 400 });

    const validBuckets: MediaBucket[] = ['article-covers', 'article-content', 'author-avatars'];
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json({ error: `Invalid bucket: ${bucket}` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadMedia(
      buffer,
      file.name,
      file.type,
      bucket,
      user.email ?? user.id,
      false // never block on Stellar inside uploadMedia
    );

    // Fire-and-forget Stellar anchoring — does not block the response
    if (anchorOnStellar && result.media.contentHash) {
      const mediaId = result.media.id;
      const contentHash = result.media.contentHash;
      Promise.resolve().then(async () => {
        try {
          const anchorResult = await anchorHashOnStellar(mediaId, contentHash);
          await updateStellarTxHash(supabase, mediaId, anchorResult.txHash);
        } catch (err) {
          console.error('Stellar anchoring failed:', err);
        }
      });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    console.error('Upload error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
