import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/database.types';
import type { TypedSupabaseClient } from '@/lib/supabase/client';
import { supabaseEnv } from '@/lib/supabase/env';

/**
 * Server-side Supabase client for Server Components, Route Handlers
 * and Server Actions.
 *
 * A new client is created per request (it reads cookies from
 * `next/headers`) — do NOT cache it in a module-level variable.
 */
export async function createClient(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // It is safe to ignore: middleware keeps the session fresh.
        }
      },
    },
  });
}
