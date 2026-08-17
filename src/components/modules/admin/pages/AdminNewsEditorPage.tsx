import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Languages } from 'lucide-react';
import { saveAdminNewsArticleAction } from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/server';
import { canEditArticle, canPublish, canReview } from '@/lib/editorial/permissions';
import { fetchAdminNewsById, fetchAdminNewsFormOptions } from '../services/news.service';
import { StellarReferenceField } from '../ui/StellarReferenceField';
import { fetchAdminArticleVersions } from '../services/versions.service';
import { requireAdmin } from '../services/auth.service';
import { listThread } from '../services/reviews.service';
import { getTranslationStatus } from '../services/translations.service';
import { TranslationStatusBadge } from '../ui/TranslationStatusBadge';
import { StatusTransitionMenu } from '../ui/StatusTransitionMenu';
import { SchedulePicker } from '../ui/SchedulePicker';
import { ReviewCommentThread } from '../ui/ReviewCommentThread';
import { VersionHistorySidebar } from '@/components/modules/news/ui/VersionHistorySidebar';

interface AdminNewsEditorPageContentProps {
  articleId?: string;
}

export async function AdminNewsEditorPageContent({ articleId }: AdminNewsEditorPageContentProps) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const options = await fetchAdminNewsFormOptions(supabase);
  const article = articleId ? await fetchAdminNewsById(supabase, articleId) : null;

  if (articleId && !article) {
    notFound();
  }

  const versions = articleId ? await fetchAdminArticleVersions(supabase, articleId) : [];
  const currentVersionNumber = versions.length > 0 ? versions[0].versionNumber : 1;

  const reviewEvents = articleId ? await listThread(supabase, articleId) : [];

  // Null on a brand new article, which has no row to translate yet.
  const translationStatus = articleId ? await getTranslationStatus(supabase, articleId) : null;

  const ownsArticle =
    article !== null && session.authorId !== null && session.authorId === article.authorId;
  const canEdit =
    article === null || canEditArticle(session.role, { ownsArticle, status: article.status });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      {/* ── Editor form ── */}
      <form
        action={saveAdminNewsArticleAction}
        className="space-y-4 rounded-2xl border bg-card p-5"
      >
        {articleId ? <input type="hidden" name="id" value={articleId} /> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Title">
            <Input name="title" required defaultValue={article?.title} />
          </Field>
          <Field label="Slug">
            <Input name="slug" required defaultValue={article?.slug} />
          </Field>
        </div>

        <Field label="Summary">
          <Textarea name="summary" required defaultValue={article?.summary} />
        </Field>

        <Field label="Content (HTML or plain text)">
          <StellarReferenceField
            name="content"
            required
            className="min-h-40"
            defaultValue={article?.content}
          />
        </Field>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Category">
            <select
              name="category"
              defaultValue={article?.category ?? 'announcement'}
              className="h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm"
            >
              <option value="announcement">announcement</option>
              <option value="product">product</option>
              <option value="ecosystem">ecosystem</option>
              <option value="engineering">engineering</option>
              <option value="community">community</option>
            </select>
          </Field>
          <Field label="Author">
            <select
              name="authorId"
              defaultValue={article?.authorId ?? options.authors[0]?.id}
              className="h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm"
            >
              {options.authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name} ({author.slug})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Reading time (minutes)">
            <Input
              type="number"
              min={1}
              name="readingTimeMinutes"
              required
              defaultValue={article?.readingTimeMinutes ?? 2}
            />
          </Field>
          <Field label="Cover image URL">
            <Input name="coverImageUrl" defaultValue={article?.coverImageUrl} />
          </Field>
        </div>

        <Field label="Published at">
          <Input type="datetime-local" name="publishedAt" defaultValue={article?.publishedAt} />
        </Field>

        <Field label="Tags (comma-separated slugs)">
          <Input
            name="tags"
            placeholder={options.tags.map((t) => t.slug).join(', ')}
            defaultValue={article?.tags.join(', ')}
          />
        </Field>

        <div className="flex items-center justify-end gap-3">
          {!canEdit ? (
            <p className="text-xs text-muted-foreground">
              Your role cannot edit this article in “{article?.status}”.
            </p>
          ) : null}
          <Button type="submit" disabled={!canEdit}>
            {articleId ? 'Save changes' : 'Create article'}
          </Button>
        </div>
      </form>

      {/* ── Workflow sidebar ── */}
      <div className="space-y-4">
        {articleId && article ? (
          <>
            <StatusTransitionMenu
              articleId={articleId}
              status={article.status}
              role={session.role}
            />
            <SchedulePicker
              articleId={articleId}
              status={article.status}
              scheduledAt={article.scheduledAt}
              canSchedule={canPublish(session.role)}
            />
            <ReviewCommentThread
              articleId={articleId}
              status={article.status}
              events={reviewEvents}
              canReview={canReview(session.role)}
              canSubmit={canEdit}
            />
          </>
        ) : null}

        {articleId && translationStatus ? (
          <section className="space-y-3 rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Languages className="size-4 text-muted-foreground" strokeWidth={1.5} aria-hidden />
              <h3 className="text-sm font-semibold">Translations</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(translationStatus).map((entry) => (
                <TranslationStatusBadge
                  key={entry.locale}
                  locale={entry.locale}
                  status={entry.status}
                />
              ))}
            </div>
            <Button asChild size="sm" variant="outline" className="w-full justify-center">
              <Link href={`/admin/news/${articleId}/translations`}>Edit translations</Link>
            </Button>
          </section>
        ) : null}

        {articleId && (
          <VersionHistorySidebar
            articleId={articleId}
            versions={versions}
            currentVersionNumber={currentVersionNumber}
          />
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
