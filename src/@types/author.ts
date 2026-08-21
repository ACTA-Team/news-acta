import type { LocalizedContent } from '@/@types/i18n';
import type { AuthorCredentialStatus } from '@/@types/credential';

/**
 * An author resolved for one locale. `name` is never translated; `role` and
 * `bio` come from `author_translations` when a row exists.
 */
export interface Author extends Partial<LocalizedContent> {
  id: string;
  slug: string;
  name: string;
  role?: string;
  bio?: string;
  avatarUrl?: string;
  social?: {
    x?: string;
    github?: string;
    linkedin?: string;
  };
  /** `did:stellar` identity, when one has been registered for this author. */
  did?: string;
  /** The author's ACTA Author credential, when one has been issued. */
  credential?: {
    vcId: string;
    status: AuthorCredentialStatus;
    revocationReason?: string;
  };
}

export interface AuthorCardProps {
  author: Author;
  compact?: boolean;
}
