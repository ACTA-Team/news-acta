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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;

    const filters: MediaListFilters = {
      bucket: (searchParams.get('bucket') as MediaBucket) || undefined,
      search: searchParams.get('search') || undefined,
      usage: (searchParams.get('usage') as 'used' | 'unused') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 24,
    };

    const supabase = createPublicClient();
    const result = await fetchMediaList(supabase, filters);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch media';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
