import type { Tag } from '@/@types/tag';
import type { Database, TypedSupabaseClient } from '@/lib/supabase';

type TagRow = Database['public']['Tables']['tags']['Row'];

function mapTag(row: TagRow, postCount?: number): Tag {
  return {
    slug: row.slug,
    label: row.label,
    description: row.description ?? undefined,
    postCount,
  };
}

export async function fetchTags(supabase: TypedSupabaseClient): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('label', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapTag(row));
}

export async function fetchTagBySlug(
  supabase: TypedSupabaseClient,
  slug: string
): Promise<Tag | null> {
  const { data, error } = await supabase.from('tags').select('*').eq('slug', slug).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapTag(data);
}
