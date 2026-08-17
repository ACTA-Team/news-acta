import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { publishScheduledArticles } from '@/components/modules/admin/services/scheduling.service';

/**
 * Scheduled publishing endpoint.
 *
 * Invoked by the Vercel Cron declared in `vercel.json` (every 10 minutes),
 * which sends `CRON_SECRET` as a Bearer token. Running here rather than in an
 * edge function lets the job reuse the existing TypeScript services:
 * attestation, versioning and Next.js revalidation.
 *
 * Overlapping runs are safe: see `publishScheduledArticles`.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Constant-time comparison so the secret cannot be recovered by timing. */
function secretMatches(header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get('authorization');

  if (!secret || !secretMatches(header, secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await publishScheduledArticles();
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron] publish-scheduled failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'publish failed' },
      { status: 500 }
    );
  }
}
