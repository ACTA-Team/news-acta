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

function hasEnv(key: string): boolean {
  const value = process.env[key];
  return typeof value === 'string' && value.trim().length > 0;
}

function looksLikePlaceholder(value: string): boolean {
  return value.includes('<') || value.includes('>') || value.includes('your-');
}

function hasValidSupabaseUrl(): boolean {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (typeof value !== 'string') return false;

  const normalized = value.trim();
  if (normalized.length === 0 || looksLikePlaceholder(normalized)) return false;

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Lazy getters so the module can be imported during `next build` without
 * requiring env vars to be present. Values are only read when actually
 * accessed (i.e., at request time when a Supabase client is created).
 */
export const supabaseEnv = {
  get url() {
    return readEnv('NEXT_PUBLIC_SUPABASE_URL');
  },
  get anonKey() {
    return readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },
} as const;

export function hasSupabasePublicEnv(): boolean {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasValidAnonKey =
    typeof anonKey === 'string' && anonKey.trim().length > 0 && !looksLikePlaceholder(anonKey);

  return hasValidSupabaseUrl() && hasValidAnonKey && hasEnv('NEXT_PUBLIC_SUPABASE_URL');
}
