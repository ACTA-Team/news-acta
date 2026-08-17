import type { LegalBlock, LegalDocument } from '@/config/legal';
import { Container, Prose } from '@/layouts';

import { LegalRichText } from './LegalRichText';

type LegalDocPageProps = {
  document: LegalDocument;
  /** Already-formatted, already-localized: "Last updated: April 24, 2026". */
  lastUpdatedLabel: string;
  eyebrow: string;
};

function Block({ block }: { block: LegalBlock }) {
  if (block.type === 'h3') {
    return <h3>{block.text}</h3>;
  }

  if (block.type === 'ul') {
    return (
      <ul>
        {block.items.map((item, index) => (
          <li key={index}>
            <LegalRichText text={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p>
      <LegalRichText text={block.text} />
    </p>
  );
}

export function LegalDocPage({ document, lastUpdatedLabel, eyebrow }: LegalDocPageProps) {
  return (
    <Container className="py-12 sm:py-16" size="md">
      <header className="mb-10 border-b border-border/80 pb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {document.title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{lastUpdatedLabel}</p>
      </header>
      <Prose className="text-sm sm:text-base">
        {document.intro.map((block, index) => (
          <Block key={`intro-${index}`} block={block} />
        ))}
        {/* Flattened on purpose: `Prose` styles its *direct* children, so
            wrapping each section in an element would drop the typography. */}
        {document.sections.flatMap((section) => [
          <h2 key={section.heading}>{section.heading}</h2>,
          ...section.blocks.map((block, index) => (
            <Block key={`${section.heading}-${index}`} block={block} />
          )),
        ])}
      </Prose>
    </Container>
  );
}
