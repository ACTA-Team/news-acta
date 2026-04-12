import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * Match every route except:
 *   - static assets (_next/static, _next/image)
 *   - favicon / og assets
 *   - public image extensions
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|og/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
