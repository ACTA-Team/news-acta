import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchOrphanedMedia } from '@/lib/storage/media.service';
import { OrphanViewer } from '@/components/modules/admin/media';

export const metadata: Metadata = {
  title: 'Orphaned Media — ACTA Admin',
};

export default async function OrphansPage() {
  const supabase = await createClient();
  const orphans = await fetchOrphanedMedia(supabase);

  return <OrphanViewer initialItems={orphans} />;
}
