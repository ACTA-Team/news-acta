import type { ReactNode } from 'react';

import { Container, Prose } from '@/layouts';

type LegalDocPageProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalDocPage({ title, lastUpdated, children }: LegalDocPageProps) {
  return (
    <Container className="py-12 sm:py-16" size="md">
      <header className="mb-10 border-b border-border/80 pb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          ACTA News
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </header>
      <Prose className="text-sm sm:text-base">{children}</Prose>
    </Container>
  );
}
