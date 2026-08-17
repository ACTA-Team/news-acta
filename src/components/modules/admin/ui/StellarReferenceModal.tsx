'use client';

import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ResolvedStellarEntity, StellarEntityRef } from '@/@types/stellar';
import { StellarEmbed, EmbedSkeleton } from '@/components/modules/news/ui/embeds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Portal, PortalBackdrop } from '@/components/ui/portal';
import { detectEntity, getActiveNetwork } from '@/lib/stellar';

interface StellarReferenceModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the formatted reference tag to insert, e.g. `[[stellar:G…]]`. */
  onInsert: (tag: string) => void;
}

const TYPE_LABEL: Record<StellarEntityRef['type'], string> = {
  transaction: 'Transaction',
  contract: 'Contract',
  account: 'Account',
  asset: 'Asset',
};

/**
 * Modal for inserting a Stellar reference into article content. Client Component.
 *
 * Validates the pasted id locally (checksum-aware), previews the resolved
 * embed via the admin-gated `/api/stellar/resolve` route, and inserts a
 * `[[stellar:VALUE]]` tag on confirm.
 */
export function StellarReferenceModal({ open, onClose, onInsert }: StellarReferenceModalProps) {
  const [value, setValue] = useState('');
  const [ref, setRef] = useState<StellarEntityRef | null>(null);
  const [entity, setEntity] = useState<ResolvedStellarEntity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const network = getActiveNetwork();

  const reset = useCallback(() => {
    setValue('');
    setRef(null);
    setEntity(null);
    setLoading(false);
    setError(null);
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const handlePreview = useCallback(async () => {
    setError(null);
    setEntity(null);
    const detected = detectEntity(value.trim(), network);
    if (!detected) {
      setRef(null);
      setError('Unrecognized Stellar entity. Check the id and its checksum.');
      return;
    }
    setRef(detected);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/stellar/resolve?entity=${encodeURIComponent(detected.id)}&network=${network}`
      );
      const json = await res.json();
      if (json.ok) {
        setEntity(json.entity as ResolvedStellarEntity);
      } else {
        // The ref is valid; resolution failed: still allow insert with a fallback.
        setEntity({ ref: detected, status: 'error', resolvedAt: new Date().toISOString() });
      }
    } catch {
      setEntity({ ref: detected, status: 'error', resolvedAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }, [value, network]);

  const handleInsert = useCallback(() => {
    if (!ref) return;
    onInsert(`[[stellar:${ref.id}]]`);
    close();
  }, [ref, onInsert, close]);

  if (!open) return null;

  return (
    <Portal>
      <PortalBackdrop onClick={close} />
      <div className="m-auto flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Insert Stellar Reference</h2>
          <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close">
            <X />
          </Button>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="stellar-ref-input">
            Transaction hash, contract id, account address, or CODE:ISSUER
          </label>
          <div className="flex gap-2">
            <Input
              id="stellar-ref-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handlePreview();
                }
              }}
              placeholder="G… / C… / 64-char hash / USDC:G…"
              autoFocus
            />
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={!value.trim()}
            >
              Preview
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Resolving on <span className="font-medium">{network}</span>.
          </p>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        {ref ? (
          <div className="rounded-xl border border-dashed border-border p-3">
            <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              {TYPE_LABEL[ref.type]} preview
            </div>
            {loading ? <EmbedSkeleton /> : entity ? <StellarEmbed entity={entity} /> : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!ref}>
            Insert reference
          </Button>
        </div>
      </div>
    </Portal>
  );
}
