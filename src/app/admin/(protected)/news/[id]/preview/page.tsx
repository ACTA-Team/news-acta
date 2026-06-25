import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';
import { fetchAdminNewsById } from '@/components/modules/admin/services/news.service';
import { fetchAdminArticleVersionByNumber } from '@/components/modules/admin/services/versions.service';

interface AdminVersionPreviewPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}

export default async function AdminVersionPreviewPage({
  params,
  searchParams,
}: AdminVersionPreviewPageProps) {
  const { id } = await params;
  const { version: versionParam } = await searchParams;
  const versionNumber = versionParam ? Number(versionParam) : null;

  if (!versionNumber || Number.isNaN(versionNumber)) notFound();

  const supabase = await createClient();
  const article = await fetchAdminNewsById(supabase, id);
  if (!article) notFound();

  const version = await fetchAdminArticleVersionByNumber(supabase, id, versionNumber);
  if (!version) notFound();

  return (
    <Container>
      <div className="mx-auto max-w-3xl py-10">
        {/* Preview banner */}
        <div className="mb-8 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <span className="font-semibold">Previewing version {version.versionNumber}</span>
            <span className="text-amber-500">—</span>
            <span>This is a historical snapshot, not the live article.</span>
          </div>
          <Link
            href={`/admin/news/${id}/edit`}
            className="ml-4 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
          >
            ← Back to editor
          </Link>
        </div>

        {/* Version metadata */}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono dark:border-zinc-800 dark:bg-zinc-900">
            v{version.versionNumber}
          </span>
          <time dateTime={version.createdAt}>
            {new Date(version.createdAt).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </time>
          {version.editedBy && <span>{version.editedBy}</span>}
          {version.stellarTxHash && (
            <span className="flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">
              ✦ anchored on Stellar
            </span>
          )}
        </div>

        {/* Frozen article content */}
        <article className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            <span>{version.category}</span>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {version.title}
          </h1>

          <p className="text-lg text-zinc-600 dark:text-zinc-400">{version.summary}</p>

          <div
            className="prose prose-zinc max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: version.content }}
          />
        </article>

        {/* Hash chain verification */}
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Hash chain
          </p>
          <div className="flex flex-col gap-1 font-mono text-xs text-zinc-500">
            <span>content_hash: {version.contentHash}</span>
            {version.previousHash && <span>previous_hash: {version.previousHash}</span>}
            {version.stellarTxHash && <span>stellar_tx: {version.stellarTxHash}</span>}
          </div>
        </div>
      </div>
    </Container>
  );
}
