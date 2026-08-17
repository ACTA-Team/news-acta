import React from 'react';
import type { ActivityEvent } from '@/@types/activity';

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div>
      <h2>Activity Feed</h2>
      <ul>
        {events.map((e) => (
          <li key={e.id}>
            <strong>{e.event_type}</strong> · {e.summary} · <em>{e.significance}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
