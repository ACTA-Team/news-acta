import { createHash } from 'crypto';

export function computeArticleHash({
  title,
  summary,
  content,
  published_at,
}: {
  title: string;
  summary: string;
  content: string;
  published_at: string;
}): string {
  // Deterministic hash: concatenate fields in order
  const data = `${title}\n${summary}\n${content}\n${published_at}`;
  return createHash('sha256').update(data).digest('hex');
}
