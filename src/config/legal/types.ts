/**
 * Structured legal copy.
 *
 * The terms and privacy pages are the only long-form prose the site ships in
 * both languages, and they carry real markup: headings, bullet lists, bold lead
 * ins and a handful of links. Keeping them as JSX per locale would mean
 * maintaining two component trees; keeping them as flat dictionary strings would
 * lose the structure. So they live here as data, and one renderer turns them
 * into markup.
 *
 * Inline markup understood by the renderer:
 *   **bold**            strong emphasis
 *   [label](https://…)  external link, opened in a new tab
 *
 * Anything else is literal text. That is deliberately the smallest grammar that
 * covers the existing copy, so a translator can work on these files without
 * touching React.
 */

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] };

export interface LegalSection {
  /** Rendered as an `<h2>`, numbered in the copy itself. */
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  /** Blocks before the first numbered section. */
  intro: LegalBlock[];
  sections: LegalSection[];
}

export interface LegalCopy {
  terms: LegalDocument;
  privacy: LegalDocument;
}
