import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import type { TypedSupabaseClient } from '@/lib/supabase/client';
import { supabaseEnv } from '@/lib/supabase/env';

/**
 * Anonymous Supabase client with no cookie / session handling.
 *
 * Use this from places where:
 *   - There is no request context (edge OG images, build-time generation).
 *   - You only need public read access covered by RLS.
 *
 * Do NOT use for user-specific queries — it has no session.
 */
export function createPublicClient(): TypedSupabaseClient {
  return createSupabaseClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
