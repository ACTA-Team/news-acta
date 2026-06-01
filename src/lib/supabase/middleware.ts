import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/database.types';
import { hasSupabasePublicEnv, supabaseEnv } from '@/lib/supabase/env';

let hasLoggedMissingEnvWarning = false;

/**
 * Session refresh helper used by the root `middleware.ts`.
 *
 * Keeps the Supabase auth session fresh for every request that matches
 * the middleware matcher. Do not remove the `supabase.auth.getUser()`
 * call: it is what actually rotates the cookies.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicEnv()) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error(
        'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }

    if (!hasLoggedMissingEnvWarning) {
      hasLoggedMissingEnvWarning = true;
      console.warn('Supabase env vars are missing. Skipping auth session refresh in development.');
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Required: rotates the session cookies when near expiry.
  await supabase.auth.getUser();

  return response;
}
