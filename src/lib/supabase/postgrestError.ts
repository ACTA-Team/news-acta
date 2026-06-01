import type { PostgrestError } from '@supabase/supabase-js';

/**
 * PGRST205: table or view is missing from the PostgREST schema cache (e.g. migrations not applied).
 * See `supabase/migrations/0001_initial_schema.sql`.
 */
const MISSING_IN_CACHE = 'PGRST205';

function messageLooksLikeMissingSchema(m: string | undefined): boolean {
  if (!m) return false;
  return m.includes('Could not find the table') || m.includes('Could not find the relation');
}

export function isMissingSchemaCacheError(
  error: PostgrestError | { code?: string; message?: string } | null
): boolean {
  if (!error) return false;
  if (error.code === MISSING_IN_CACHE) return true;
  return messageLooksLikeMissingSchema('message' in error ? error.message : undefined);
}

export function warnMissingMigrationsOnce(): void {
  if (process.env.NODE_ENV !== 'development') return;
  if (typeof globalThis === 'undefined') return;
  const g = globalThis as { __actaSchemaWarned?: boolean };
  if (g.__actaSchemaWarned) return;
  g.__actaSchemaWarned = true;
  console.warn(
    '[acta-news] Supabase: public schema tables are missing. Apply supabase/migrations/0001_initial_schema.sql in the Supabase SQL editor, or run: npx supabase link && npx supabase db push'
  );
}
