import {
  createAuthorIdentityAction,
  issueAuthorCredentialAction,
  revokeAuthorCredentialAction,
} from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AuthorCredentialStatus } from '@/@types/credential';

interface AuthorIdentityPanelProps {
  authorId: string;
  authorSlug: string;
  authorName: string;
  authorRole: string | null;
  did?: string;
  credential?: {
    vcId: string;
    status: AuthorCredentialStatus;
    revocationReason?: string;
  };
}

const STATUS_LABEL: Record<AuthorCredentialStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  revoked: 'Revoked',
  failed: 'Failed',
};

const STATUS_CLASS: Record<AuthorCredentialStatus, string> = {
  pending: 'text-amber-600',
  active: 'text-emerald-600',
  revoked: 'text-zinc-500',
  failed: 'text-red-600',
};

/**
 * Per-author actions for issue #42: create identity -> issue credential ->
 * revoke credential. Every submit is async and never blocks past the claim
 * step (see `revalidateAuthorPaths` in `actions.ts`); a `failed` credential
 * is retried with the same "Issue credential" action since
 * `issueAuthorCredential` is idempotent on `vc_id`.
 */
export function AuthorIdentityPanel({
  authorId,
  authorSlug,
  authorName,
  authorRole,
  did,
  credential,
}: AuthorIdentityPanelProps) {
  if (!did) {
    return (
      <form action={createAuthorIdentityAction} className="flex justify-end">
        <input type="hidden" name="authorId" value={authorId} />
        <input type="hidden" name="authorSlug" value={authorSlug} />
        <Button type="submit" size="sm" variant="outline">
          Create identity
        </Button>
      </form>
    );
  }

  if (!credential || credential.status === 'failed') {
    return (
      <form action={issueAuthorCredentialAction} className="flex flex-col items-end gap-1">
        <input type="hidden" name="authorId" value={authorId} />
        <input type="hidden" name="authorSlug" value={authorSlug} />
        <input type="hidden" name="name" value={authorName} />
        <input type="hidden" name="role" value={authorRole ?? 'Author'} />
        {credential?.status === 'failed' ? (
          <span className={`text-xs ${STATUS_CLASS.failed}`}>Last attempt failed</span>
        ) : null}
        <Button type="submit" size="sm" variant="outline">
          {credential?.status === 'failed' ? 'Retry issue credential' : 'Issue credential'}
        </Button>
      </form>
    );
  }

  if (credential.status === 'pending') {
    return <span className={`text-xs ${STATUS_CLASS.pending}`}>Issuing on-chain…</span>;
  }

  if (credential.status === 'active') {
    return (
      <form
        action={revokeAuthorCredentialAction}
        className="flex flex-wrap items-center justify-end gap-2"
      >
        <input type="hidden" name="authorSlug" value={authorSlug} />
        <input type="hidden" name="vcId" value={credential.vcId} />
        <Input
          name="reason"
          placeholder="Revocation reason"
          required
          className="h-8 w-40 text-xs"
        />
        <Button type="submit" size="sm" variant="destructive">
          Revoke
        </Button>
      </form>
    );
  }

  // revoked
  return (
    <div className="flex flex-col items-end gap-1 text-xs">
      <span className={STATUS_CLASS.revoked}>{STATUS_LABEL.revoked}</span>
      {credential.revocationReason ? (
        <span className="text-muted-foreground">{credential.revocationReason}</span>
      ) : null}
    </div>
  );
}
