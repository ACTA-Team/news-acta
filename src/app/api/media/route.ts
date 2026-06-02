/**
 * GET /api/media — paginated media library query
 *
 * Query params: bucket, search, usage, dateFrom, dateTo, page, pageSize
 * Public read (matches RLS policy).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { fetchMediaList } from '@/lib/storage/media.service';
import type { MediaBucket, MediaListFilters } from '@/@types/media';

function clampInt(value: string | null, min: number, max: number, fallback: number): number {
  const n = parseInt(value ?? '', 10);
  if (!isFinite(n) || n < min) return fallback;
  if (n > max) return max;
  return n;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;

    const filters: MediaListFilters = {
      bucket: (searchParams.get('bucket') as MediaBucket) || undefined,
      search: searchParams.get('search') || undefined,
      usage: (searchParams.get('usage') as 'used' | 'unused') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: clampInt(searchParams.get('page'), 1, 10_000, 1),
      pageSize: clampInt(searchParams.get('pageSize'), 1, 100, 24),
    };

    const supabase = createPublicClient();
    const result = await fetchMediaList(supabase, filters);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch media';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
