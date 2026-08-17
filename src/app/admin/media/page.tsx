import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchMediaList } from '@/lib/storage/media.service';
import { MediaLibraryClient } from '@/components/modules/admin/media';

export const metadata: Metadata = {
  title: 'Media Library (ACTA Admin)',
};

export default async function MediaLibraryPage() {
  const supabase = await createClient();
  const initialData = await fetchMediaList(supabase, { page: 1 });

  return <MediaLibraryClient initialData={initialData} />;
}
