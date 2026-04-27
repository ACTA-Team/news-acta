import { notFound } from 'next/navigation';
import { saveAdminNewsArticleAction } from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/server';
import { fetchAdminNewsById, fetchAdminNewsFormOptions } from '../services/news.service';

interface AdminNewsEditorPageContentProps {
  articleId?: string;
}

export async function AdminNewsEditorPageContent({ articleId }: AdminNewsEditorPageContentProps) {
  const supabase = await createClient();
  const options = await fetchAdminNewsFormOptions(supabase);
  const article = articleId ? await fetchAdminNewsById(supabase, articleId) : null;

  if (articleId && !article) {
    notFound();
  }

  return (
    <form action={saveAdminNewsArticleAction} className="space-y-4 rounded-2xl border bg-card p-5">
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
        <Textarea name="content" required className="min-h-40" defaultValue={article?.content} />
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
        <Field label="Status">
          <select
            name="status"
            defaultValue={article?.status ?? 'draft'}
            className="h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm"
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
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
        <Field label="Reading time (minutes)">
          <Input
            type="number"
            min={1}
            name="readingTimeMinutes"
            required
            defaultValue={article?.readingTimeMinutes ?? 2}
          />
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Cover image URL">
          <Input name="coverImageUrl" defaultValue={article?.coverImageUrl} />
        </Field>
        <Field label="Published at">
          <Input type="datetime-local" name="publishedAt" defaultValue={article?.publishedAt} />
        </Field>
      </div>

      <Field label="Tags (comma-separated slugs)">
        <Input
          name="tags"
          placeholder={options.tags.map((t) => t.slug).join(', ')}
          defaultValue={article?.tags.join(', ')}
        />
      </Field>

      <div className="flex justify-end">
        <Button type="submit">{articleId ? 'Save changes' : 'Create article'}</Button>
      </div>
    </form>
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
