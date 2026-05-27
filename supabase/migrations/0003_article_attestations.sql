-- Migration: Create article_attestations table for on-chain attestation
CREATE TABLE IF NOT EXISTS public.article_attestations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id uuid NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    version integer NOT NULL,
    content_hash text NOT NULL,
    stellar_tx_hash text,
    ledger integer,
    network text NOT NULL,
    status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
    previous_attestation_id uuid REFERENCES article_attestations(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT article_attestations_unique_version UNIQUE (article_id, version)
);

CREATE INDEX IF NOT EXISTS idx_article_attestations_article_id ON public.article_attestations(article_id);
CREATE INDEX IF NOT EXISTS idx_article_attestations_stellar_tx_hash ON public.article_attestations(stellar_tx_hash);

-- RLS: public read, admin write
ALTER TABLE public.article_attestations ENABLE ROW LEVEL SECURITY;

-- Policy: public can read
CREATE POLICY article_attestations_select ON public.article_attestations
    FOR SELECT USING (true);
-- Policy: only admin can insert/update/delete
CREATE POLICY article_attestations_admin_write ON public.article_attestations
    FOR ALL USING (auth.role() = 'admin');
