export type EventType =
  | 'contract_deploy'
  | 'payment'
  | 'trust_change'
  | 'contract_invoke'
  | 'data_entry'
  | 'account_create';

export type Significance = 'low' | 'medium' | 'high' | 'critical';

export interface MonitoredAccount {
  id: string;
  stellar_address: string;
  label: string;
  account_type: string;
  monitor_events: string[];
  active: boolean;
  last_cursor?: string | null;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  account_id: string;
  source_account: string;
  event_type: EventType;
  significance: Significance;
  raw_data: any;
  summary?: string;
  processed: boolean;
  draft_article_id?: string | null;
  detected_at: string;
  tx_hash?: string | null;
}
