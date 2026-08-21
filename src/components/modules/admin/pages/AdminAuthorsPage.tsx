import { createClient } from '@/lib/supabase/server';
import { fetchAuthors } from '@/components/modules/authors/services/authors.service';
import { requireRole } from '../services/roles.service';
import { AuthorIdentityPanel } from '../ui/AuthorIdentityPanel';

/** Author identity & credential management for issue #42. Owner/editor only. */
export async function AdminAuthorsPageContent() {
  await requireRole('owner', 'editor');
  const supabase = await createClient();
  const authors = await fetchAuthors(supabase);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4">
        <h2 className="text-sm font-semibold">Verifiable author identity</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Each author gets a real <code>did:stellar</code> identity and an &ldquo;ACTA Author&rdquo;
          credential issued through the ACTA SDK. Issuance costs an on-chain fee paid by the
          blog&apos;s issuer account, so it is one credential per author, not per article.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">DID</th>
              <th className="px-4 py-3">Credential</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {authors.map((author) => (
              <tr key={author.id} className="border-t align-top">
                <td className="px-4 py-3">
                  <div className="font-medium">{author.name}</div>
                  <div className="text-xs text-muted-foreground">{author.slug}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {author.did ?? '—'}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {author.credential?.status ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <AuthorIdentityPanel
                    authorId={author.id}
                    authorSlug={author.slug}
                    authorName={author.name}
                    authorRole={author.role ?? null}
                    did={author.did}
                    credential={
                      author.credential
                        ? {
                            vcId: author.credential.vcId,
                            status: author.credential.status,
                            revocationReason: author.credential.revocationReason,
                          }
                        : undefined
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {authors.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No authors yet.</p>
        ) : null}
      </div>
    </div>
  );
}
