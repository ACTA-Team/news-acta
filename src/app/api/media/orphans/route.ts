/**
 * POST /api/media/orphans — trigger orphan detection (recalculate usage counts)
 * GET  /api/media/orphans — fetch orphaned media items
 *
 * Both require an authenticated session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recalculateUsageCounts, fetchOrphanedMedia } from '@/lib/storage/media.service';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orphans = await fetchOrphanedMedia(supabase);
    return NextResponse.json({ items: orphans, total: orphans.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orphans';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await recalculateUsageCounts(supabase);
    const orphans = await fetchOrphanedMedia(supabase);

    return NextResponse.json({
      message: 'Usage counts recalculated',
      orphanCount: orphans.length,
      items: orphans,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Orphan detection failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
