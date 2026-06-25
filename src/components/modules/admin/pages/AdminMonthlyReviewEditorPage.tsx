'use client';

import { useState, startTransition } from 'react';
import Link from 'next/link';
import { saveAdminMonthlyReviewAction, fetchMetricsForPeriodAction } from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AdminReviewEditorData, AdminReviewFormOptions } from '../services/monthly-review.service';
import { RefreshCw, Plus, Trash2, ShieldCheck, Database, Zap } from 'lucide-react';

interface AdminMonthlyReviewEditorPageContentProps {
  review: AdminReviewEditorData | null;
  options: AdminReviewFormOptions;
}

export function AdminMonthlyReviewEditorPageContent({
  review,
  options,
}: AdminMonthlyReviewEditorPageContentProps) {
  // Main form fields
  const [period, setPeriod] = useState(review?.period ?? new Date().toISOString().slice(0, 7));
  const [title, setTitle] = useState(review?.title ?? '');
  const [summary, setSummary] = useState(review?.summary ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(review?.coverImageUrl ?? '');
  const [publishedAt, setPublishedAt] = useState(review?.publishedAt ?? new Date().toISOString().slice(0, 16));
  const [featuredArticles, setFeaturedArticles] = useState<string[]>(review?.featuredArticleIds ?? []);

  // Highlights state
  const [highlights, setHighlights] = useState<Array<{ title: string; description: string; href?: string }>>(
    review?.highlights ?? []
  );

  // Metrics state (Dual onChain + editorial schema)
  const initialMetrics = review?.metrics;
  const initialOnChain = initialMetrics?.onChain ? initialMetrics.onChain : undefined;
  const initialEditorial = Array.isArray(initialMetrics)
    ? initialMetrics
    : (initialMetrics?.editorial ?? []);

  const [onChainMetrics, setOnChainMetrics] = useState<any>(initialOnChain);
  const [editorialMetrics, setEditorialMetrics] = useState<Array<{ label: string; value: string; delta?: string; direction?: 'up' | 'down' | 'flat' }>>(
    initialEditorial
  );
  
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshSource, setRefreshSource] = useState<'database' | 'live_api' | null>(
    review?.metrics?.onChain ? 'database' : null
  );

  // Handlers for Highlights
  const addHighlight = () => {
    setHighlights([...highlights, { title: '', description: '', href: '' }]);
  };

  const updateHighlight = (index: number, field: string, value: string) => {
    const updated = [...highlights];
    updated[index] = { ...updated[index], [field]: value };
    setHighlights(updated);
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  // Handlers for Editorial Metrics
  const addEditorialMetric = () => {
    setEditorialMetrics([...editorialMetrics, { label: '', value: '', delta: '', direction: 'flat' }]);
  };

  const updateEditorialMetric = (index: number, field: string, value: string) => {
    const updated = [...editorialMetrics];
    updated[index] = { ...updated[index], [field]: value };
    setEditorialMetrics(updated);
  };

  const removeEditorialMetric = (index: number) => {
    setEditorialMetrics(editorialMetrics.filter((_, i) => i !== index));
  };

  // Live Metrics Fetching Handler
  const handleRefreshMetrics = async () => {
    if (!period) {
      setRefreshError('Please enter a valid period (YYYY-MM) first.');
      return;
    }
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetchMetricsForPeriodAction(period, network);
      if (res.success) {
        setOnChainMetrics({
          horizon: res.horizon,
          soroban: res.soroban,
          collectedAt: res.collectedAt,
        });
        setRefreshSource(res.source as 'database' | 'live_api');
      } else {
        setRefreshError(res.error || 'Failed to refresh metrics.');
      }
    } catch (err: any) {
      setRefreshError(err.message || 'An unexpected error occurred while fetching metrics.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle Featured Articles checkbox toggles
  const toggleFeaturedArticle = (articleId: string) => {
    if (featuredArticles.includes(articleId)) {
      setFeaturedArticles(featuredArticles.filter((id) => id !== articleId));
    } else {
      setFeaturedArticles([...featuredArticles, articleId]);
    }
  };

  // Bundle the metrics JSON schema for submission
  const bundledMetrics = {
    onChain: onChainMetrics,
    editorial: editorialMetrics,
  };

  return (
    <form action={saveAdminMonthlyReviewAction} className="space-y-8 max-w-4xl">
      {review?.id ? <input type="hidden" name="id" value={review.id} /> : null}
      <input type="hidden" name="highlights" value={JSON.stringify(highlights)} />
      <input type="hidden" name="metrics" value={JSON.stringify(bundledMetrics)} />
      <input type="hidden" name="featuredArticles" value={featuredArticles.join(',')} />

      {/* CORE FIELDS */}
      <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold border-b pb-2 text-primary">Core review details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Period (YYYY-MM)">
            <Input
              type="month"
              name="period"
              required
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full"
            />
          </Field>
          <Field label="Published at">
            <Input
              type="datetime-local"
              name="publishedAt"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full"
            />
          </Field>
        </div>

        <Field label="Title">
          <Input
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Strategic expansion and Stellar Soroban metrics"
          />
        </Field>

        <Field label="Summary">
          <Textarea
            name="summary"
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Provide a compelling 1-2 sentence overview of the month's accomplishments..."
            className="min-h-20"
          />
        </Field>

        <Field label="Cover image URL">
          <Input
            name="coverImageUrl"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="e.g. https://images.unsplash.com/photo-..."
          />
        </Field>
      </section>

      {/* METRICS GENERATOR & OVERRIDES */}
      <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center border-b pb-2">
          <h2 className="text-xl font-semibold text-primary">Stellar network live metrics</h2>
          <div className="flex gap-2 items-center mt-2 sm:mt-0">
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as 'testnet' | 'mainnet')}
              className="h-8 rounded-lg border bg-transparent px-2.5 text-xs font-medium"
            >
              <option value="testnet">Testnet</option>
              <option value="mainnet">Mainnet</option>
            </select>
            <Button
              type="button"
              onClick={handleRefreshMetrics}
              disabled={isRefreshing}
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh metrics
            </Button>
          </div>
        </div>

        {/* Live Metrics Loading Banner/Status */}
        {refreshError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{refreshError}</p>
          </div>
        ) : null}

        {onChainMetrics ? (
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
                {refreshSource === 'database' ? (
                  <>
                    <Database className="h-3.5 w-3.5 text-emerald-500" />
                    Loaded from database snapshot
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    Fetched fresh from Stellar node
                  </>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                Freshness: {new Date(onChainMetrics.collectedAt).toLocaleString()}
              </span>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 text-sm">
              <div className="p-3 border rounded-xl bg-card">
                <span className="text-xs text-muted-foreground uppercase font-mono block">Transactions</span>
                <span className="text-lg font-bold text-foreground">
                  {onChainMetrics.horizon.txCount.toLocaleString()}
                </span>
              </div>
              <div className="p-3 border rounded-xl bg-card">
                <span className="text-xs text-muted-foreground uppercase font-mono block">Avg Fee</span>
                <span className="text-lg font-bold text-foreground">{onChainMetrics.horizon.avgFee}</span>
              </div>
              <div className="p-3 border rounded-xl bg-card">
                <span className="text-xs text-muted-foreground uppercase font-mono block">New Accounts</span>
                <span className="text-lg font-bold text-foreground">
                  {onChainMetrics.horizon.activeAccounts}
                </span>
              </div>
              <div className="p-3 border rounded-xl bg-card">
                <span className="text-xs text-muted-foreground uppercase font-mono block">Smart Contracts</span>
                <span className="text-lg font-bold text-foreground">
                  {onChainMetrics.soroban.invocationCount} calls
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-xl">
            No on-chain metrics loaded yet. Select a network and click 'Refresh metrics' to pull real-time data!
          </p>
        )}

        {/* Custom Editorial Metrics Overrides */}
        <div className="space-y-3 pt-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-foreground">Editorial metrics (Key KPIs)</h3>
            <Button type="button" onClick={addEditorialMetric} variant="ghost" size="sm" className="h-7 gap-1">
              <Plus className="h-3.5 w-3.5" /> Add metric
            </Button>
          </div>

          <div className="space-y-2">
            {editorialMetrics.map((metric, index) => (
              <div key={index} className="flex gap-2 items-center bg-muted/20 p-3 rounded-xl border">
                <Input
                  placeholder="Label (e.g. New Members)"
                  value={metric.label}
                  onChange={(e) => updateEditorialMetric(index, 'label', e.target.value)}
                  className="h-8 max-w-xs"
                />
                <Input
                  placeholder="Value (e.g. 15)"
                  value={metric.value}
                  onChange={(e) => updateEditorialMetric(index, 'value', e.target.value)}
                  className="h-8 max-w-xs"
                />
                <Input
                  placeholder="Delta (e.g. +12%)"
                  value={metric.delta || ''}
                  onChange={(e) => updateEditorialMetric(index, 'delta', e.target.value)}
                  className="h-8 max-w-32"
                />
                <select
                  value={metric.direction || 'flat'}
                  onChange={(e) => updateEditorialMetric(index, 'direction', e.target.value)}
                  className="h-8 rounded-lg border bg-transparent px-2.5 text-xs"
                >
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="flat">Flat</option>
                </select>
                <Button
                  type="button"
                  onClick={() => removeEditorialMetric(index)}
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {editorialMetrics.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">No editorial metrics added.</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS SECTION */}
      <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-xl font-semibold text-primary">Monthly Highlights</h2>
          <Button type="button" onClick={addHighlight} variant="outline" size="sm" className="h-8 gap-1">
            <Plus className="h-3.5 w-3.5" /> Add highlight
          </Button>
        </div>

        <div className="space-y-3">
          {highlights.map((highlight, index) => (
            <div key={index} className="p-4 border rounded-xl bg-muted/10 space-y-3 relative">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold font-mono text-muted-foreground uppercase">
                  Highlight #{index + 1}
                </span>
                <Button
                  type="button"
                  onClick={() => removeHighlight(index)}
                  variant="destructive"
                  size="sm"
                  className="h-7 px-2"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Highlight Title">
                  <Input
                    placeholder="e.g. V1 Bridge Launch"
                    value={highlight.title}
                    onChange={(e) => updateHighlight(index, 'title', e.target.value)}
                    className="h-8"
                  />
                </Field>
                <Field label="Learn More URL (Optional)">
                  <Input
                    placeholder="e.g. /news/v1-bridge-launch"
                    value={highlight.href || ''}
                    onChange={(e) => updateHighlight(index, 'href', e.target.value)}
                    className="h-8"
                  />
                </Field>
              </div>
              <Field label="Highlight Description">
                <Textarea
                  placeholder="Detail the key milestone..."
                  value={highlight.description}
                  onChange={(e) => updateHighlight(index, 'description', e.target.value)}
                  className="min-h-12 text-sm"
                />
              </Field>
            </div>
          ))}
          {highlights.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-xl">
              No highlights added yet. Milestones build trust with your community!
            </p>
          ) : null}
        </div>
      </section>

      {/* FEATURED ARTICLES SELECTION */}
      <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold border-b pb-2 text-primary">Featured news articles</h2>
        <p className="text-xs text-muted-foreground">Select published articles from this period to feature in this monthly review.</p>
        
        <div className="max-h-60 overflow-y-auto border rounded-xl p-3 space-y-1.5 bg-muted/10">
          {options.articles.map((article) => {
            const isFeatured = featuredArticles.includes(article.id);
            return (
              <label
                key={article.id}
                className={`flex items-center gap-3 p-2 border rounded-xl bg-card hover:bg-muted/30 cursor-pointer transition-colors ${
                  isFeatured ? 'border-primary ring-1 ring-primary' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={() => toggleFeaturedArticle(article.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="text-sm">
                  <div className="font-medium text-foreground">{article.title}</div>
                  <div className="text-xs text-muted-foreground">/{article.slug}</div>
                </div>
              </label>
            );
          })}
          {options.articles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No published news articles available. Feature articles once they are published!
            </p>
          ) : null}
        </div>
      </section>

      {/* SAVE BUTTON */}
      <div className="flex justify-end gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/monthly-reviews">Cancel</Link>
        </Button>
        <Button type="submit">{review?.id ? 'Save changes' : 'Create monthly review'}</Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
