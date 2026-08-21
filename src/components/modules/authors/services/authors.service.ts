import type { Author } from '@/@types/author';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/config';
import type { Database, TypedSupabaseClient } from '@/lib/supabase';
import {
  isMissingSchemaCacheError,
  warnMissingMigrationsOnce,
} from '@/lib/supabase/postgrestError';

type AuthorRow = Database['public']['Tables']['authors']['Row'];

interface AuthorSocial {
  x?: string;
  github?: string;
  linkedin?: string;
}

interface EmbeddedAuthorTranslation {
  locale: Locale;
  role: string | null;
  bio: string | null;
}

interface EmbeddedAuthorIdentity {
  did: string;
}

interface EmbeddedAuthorCredential {
  vc_id: string;
  status: 'pending' | 'active' | 'revoked' | 'failed';
  revocation_reason: string | null;
}

type AuthorRowWithTranslations = AuthorRow & {
  translations: EmbeddedAuthorTranslation[] | null;
  identity: EmbeddedAuthorIdentity | null;
  credentials: EmbeddedAuthorCredential[] | null;
};

/**
 * A person's name and avatar are the same in every language; `role` and `bio`
 * are the only prose, so those are what `author_translations` carries.
 *
 * `identity`/`credentials` surface the did:stellar identity and the "ACTA
 * Author" credential (issue #42) so the verified badge never needs a second
 * round trip.
 */
const AUTHOR_SELECT = `
  id, slug, name, role, bio, avatar_url, social, created_at, updated_at,
  translations:author_translations ( locale, role, bio ),
  identity:author_identities ( did ),
  credentials:author_credentials ( vc_id, status, revocation_reason )
` as const;

function mapAuthor(row: AuthorRowWithTranslations, requested: Locale): Author {
  const social = (row.social ?? {}) as AuthorSocial;
  const match = (row.translations ?? []).find(
    (translation) => isLocale(translation.locale) && translation.locale === requested
  );

  const availableLocales = [
    DEFAULT_LOCALE,
    ...(row.translations ?? [])
      .map((translation) => translation.locale)
      .filter((locale): locale is Locale => isLocale(locale)),
  ];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    // A translation row may fill in only one of the two fields; each falls back
    // to the source independently rather than as a pair.
    role: match?.role ?? row.role ?? undefined,
    bio: match?.bio ?? row.bio ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    social: {
      x: social.x,
      github: social.github,
      linkedin: social.linkedin,
    },
    locale: match ? requested : DEFAULT_LOCALE,
    sourceLocale: DEFAULT_LOCALE,
    isTranslated: Boolean(match),
    availableLocales: [...new Set(availableLocales)],
    did: row.identity?.did,
    credential: row.credentials?.[0]
      ? {
          vcId: row.credentials[0].vc_id,
          status: row.credentials[0].status,
          revocationReason: row.credentials[0].revocation_reason ?? undefined,
        }
      : undefined,
  };
}

export async function fetchAuthors(
  supabase: TypedSupabaseClient,
  locale: Locale = DEFAULT_LOCALE
): Promise<Author[]> {
  const { data, error } = await supabase
    .from('authors')
    .select(AUTHOR_SELECT)
    .order('name', { ascending: true });

  if (error) {
    if (isMissingSchemaCacheError(error)) {
      warnMissingMigrationsOnce();
      return [];
    }
    throw error;
  }

  return ((data ?? []) as unknown as AuthorRowWithTranslations[]).map((row) =>
    mapAuthor(row, locale)
  );
}

export async function fetchAuthorBySlug(
  supabase: TypedSupabaseClient,
  slug: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<Author | null> {
  const { data, error } = await supabase
    .from('authors')
    .select(AUTHOR_SELECT)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaCacheError(error)) {
      warnMissingMigrationsOnce();
      return null;
    }
    throw error;
  }
  if (!data) return null;

  return mapAuthor(data as unknown as AuthorRowWithTranslations, locale);
}
