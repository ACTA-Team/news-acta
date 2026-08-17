/**
 * GET /api/media/[id]/articles: articles that reference a media item
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { fetchMediaById, fetchMediaArticleRefs } from '@/lib/storage/media.service';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = createPublicClient();

    const item = await fetchMediaById(supabase, id);
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const articles = await fetchMediaArticleRefs(supabase, item);
    return NextResponse.json({ items: articles });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch article refs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
