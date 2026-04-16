import type { Author } from '@/@types/author';
import type { Database, TypedSupabaseClient } from '@/lib/supabase';

type AuthorRow = Database['public']['Tables']['authors']['Row'];

interface AuthorSocial {
  x?: string;
  github?: string;
  linkedin?: string;
}

function mapAuthor(row: AuthorRow): Author {
  const social = (row.social ?? {}) as AuthorSocial;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    role: row.role ?? undefined,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    social: {
      x: social.x,
      github: social.github,
      linkedin: social.linkedin,
    },
  };
}

export async function fetchAuthors(supabase: TypedSupabaseClient): Promise<Author[]> {
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapAuthor);
}

export async function fetchAuthorBySlug(
  supabase: TypedSupabaseClient,
  slug: string
): Promise<Author | null> {
  const { data, error } = await supabase.from('authors').select('*').eq('slug', slug).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapAuthor(data);
}
