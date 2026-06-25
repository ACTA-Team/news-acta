import { createAdminClient } from '../../../src/lib/supabase/admin';
import { fetchOperationsSince, classifyOperation } from '../../../src/lib/stellar/scanner';

const HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon.stellar.org';

export default async function handler() {
  const supabase = createAdminClient();

  // fetch active monitored accounts
  const { data: accounts } = await supabase
    .from('monitored_accounts')
    .select('*')
    .eq('active', true);
  if (!accounts) return { processed: 0 };

  let processed = 0;

  for (const acct of accounts) {
    try {
      const { operations, nextCursor } = await fetchOperationsSince(
        HORIZON_URL,
        acct.stellar_address,
        acct.last_cursor || undefined
      );
      for (const op of operations) {
        const classification = classifyOperation(op);
        // basic dedupe: by tx_hash
        const txHash = op.transaction_hash || null;
        const { data: existing } = await supabase
          .from('activity_events')
          .select('id')
          .eq('tx_hash', txHash)
          .limit(1);
        if (existing && existing.length) continue;

        await supabase.from('activity_events').insert([
          {
            account_id: acct.id,
            source_account: op.source_account || acct.stellar_address,
            event_type: classification.eventType,
            significance: classification.significance,
            raw_data: op,
            summary: classification.summary,
            tx_hash: txHash,
            detected_at: new Date().toISOString(),
          },
        ]);
        processed++;
      }

      // update cursor if we got one
      if (nextCursor) {
        await supabase
          .from('monitored_accounts')
          .update({ last_cursor: nextCursor })
          .eq('id', acct.id);
      }
    } catch (err) {
      // log and continue
      console.error('scan error', acct.stellar_address, err);
    }
  }

  return { processed };
}
