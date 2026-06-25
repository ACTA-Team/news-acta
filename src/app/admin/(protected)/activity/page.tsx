import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { ActivityFeed } from '@/components/modules/admin/activity/ActivityFeed';
import type { ActivityEvent } from '@/@types/activity';

export default async function ActivityPage() {
  const supabase = createAdminClient();
  const { data: events } = await supabase
    .from('activity_events')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(50);
  return (
    <div>
      <h1>Admin — Activity</h1>
      <ActivityFeed events={(events ?? []) as unknown as ActivityEvent[]} />
    </div>
  );
}
