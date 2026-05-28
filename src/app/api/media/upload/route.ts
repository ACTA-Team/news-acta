/**
 * POST /api/media/upload
 *
 * Accepts a multipart/form-data request with:
 *   - file: the image file
 *   - bucket: MediaBucket
 *   - anchorOnStellar: "true" | "false" (optional)
 *
 * Returns UploadResponse JSON.
 * Requires an authenticated session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadMedia } from '@/lib/storage/upload';
import { anchorHashOnStellar } from '@/lib/stellar/anchor';
import { updateStellarTxHash } from '@/lib/storage/media.service';
import type { MediaBucket } from '@/@types/media';

export const runtime = 'nodejs';
// Increase body size limit for image uploads (10 MiB)
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as MediaBucket | null;
    const anchorOnStellarRaw = formData.get('anchorOnStellar');
    const anchorOnStellar = anchorOnStellarRaw === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!bucket) {
      return NextResponse.json({ error: 'No bucket specified' }, { status: 400 });
    }

    const validBuckets: MediaBucket[] = ['article-covers', 'article-content', 'author-avatars'];
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json({ error: `Invalid bucket: ${bucket}` }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run the upload pipeline
    const result = await uploadMedia(
      buffer,
      file.name,
      file.type,
      bucket,
      user.email ?? user.id,
      anchorOnStellar
    );

    // Optionally anchor on Stellar (async, non-blocking for the response)
    if (anchorOnStellar && result.media.contentHash) {
      try {
        const anchorResult = await anchorHashOnStellar(result.media.id, result.media.contentHash);
        await updateStellarTxHash(supabase, result.media.id, anchorResult.txHash);
        result.media.stellarTxHash = anchorResult.txHash;
      } catch (stellarError) {
        // Non-fatal: log but don't fail the upload
        console.error('Stellar anchoring failed:', stellarError);
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    console.error('Upload error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
