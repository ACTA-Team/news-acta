/**
 * Supabase barrel.
 *
 * Import rules:
 *   - Client Components / hooks:        '@/lib/supabase/client'  (createClient)
 *   - Server Components / route handlers: '@/lib/supabase/server'  (createClient)
 *   - Edge / build-time (no request ctx): '@/lib/supabase/public'  (createPublicClient)
 *
 * Types and env access can come from this barrel.
 */
export type { Database, Json } from './database.types';
export type { TypedSupabaseClient } from './client';
export { supabaseEnv } from './env';
