import type { ReactNode } from 'react';

/**
 * Renders the tiny inline grammar the legal copy uses.
 *
 *   **bold**            -> <strong>
 *   [label](https://…)  -> external <a>
 *
 * Deliberately not a Markdown parser: the copy is authored by us, the grammar is
 * two rules wide, and a real parser would be a dependency plus an XSS surface
 * for zero benefit. Unrecognized syntax renders as literal text.
 */

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

const LINK = /^\[([^\]]+)\]\(([^)]+)\)$/;
const BOLD = /^\*\*([^*]+)\*\*$/;

/** Only http(s) links are rendered as links; anything else stays plain text. */
function isSafeHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function LegalRichText({ text }: { text: string }): ReactNode {
  const parts = text.split(TOKEN).filter((part) => part.length > 0);

  return parts.map((part, index) => {
    const bold = BOLD.exec(part);
    if (bold) {
      return <strong key={index}>{bold[1]}</strong>;
    }

    const link = LINK.exec(part);
    if (link && isSafeHref(link[2])) {
      return (
        <a key={index} href={link[2]} rel="noreferrer" target="_blank">
          {link[1]}
        </a>
      );
    }

    return part;
  });
}
