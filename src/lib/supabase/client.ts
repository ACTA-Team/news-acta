'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { supabaseEnv } from '@/lib/supabase/env';

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Browser-side Supabase client.
 *
 * Singleton: Supabase SSR recommends a single browser client instance
 * per tab so the auth session stays consistent.
 */
let browserClient: TypedSupabaseClient | null = null;

export function createClient(): TypedSupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<Database>(
    supabaseEnv.url,
    supabaseEnv.anonKey,
  );
  return browserClient;
}
