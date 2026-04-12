/**
 * Supabase environment access.
 *
 * Single source of truth for the public env vars. Throws early if
 * something is missing so misconfigured deploys fail loud.
 */

function readEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Check .env.local or your deployment settings.`
    );
  }
  return value;
}

export const supabaseEnv = {
  url: readEnv('NEXT_PUBLIC_SUPABASE_URL'),
  anonKey: readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
} as const;
