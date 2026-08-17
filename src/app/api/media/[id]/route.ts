/**
 * PATCH /api/media/[id] : update alt text
 * DELETE /api/media/[id]: delete media item
 *
 * Both require an admin session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteMedia } from '@/lib/storage/upload';
import { updateAltText } from '@/lib/storage/media.service';

interface Params {
  params: Promise<{ id: string }>;
}

function isAdmin(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): boolean {
  return user.app_metadata?.role === 'admin' || user.user_metadata?.is_admin === true;
}

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { altText } = body as { altText?: string };

    if (typeof altText !== 'string') {
      return NextResponse.json({ error: 'altText must be a string' }, { status: 400 });
    }

    await updateAltText(supabase, id, altText);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    await deleteMedia(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
