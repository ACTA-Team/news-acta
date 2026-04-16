import type { Author } from '@/@types/author';

interface AuthorProfileProps {
  author: Author;
}

export function AuthorProfile({ author }: AuthorProfileProps) {
  return (
    <section className="flex flex-col gap-4 border-b border-zinc-200 pb-10 dark:border-zinc-800">
      <div className="h-20 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {author.name}
        </h1>
        {author.role ? <p className="text-sm text-zinc-500">{author.role}</p> : null}
      </div>
      {author.bio ? (
        <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">{author.bio}</p>
      ) : null}
      {author.social ? (
        <div className="flex gap-3 text-sm">
          {author.social.x ? (
            <a href={author.social.x} target="_blank" rel="noreferrer" className="underline">
              X
            </a>
          ) : null}
          {author.social.github ? (
            <a href={author.social.github} target="_blank" rel="noreferrer" className="underline">
              GitHub
            </a>
          ) : null}
          {author.social.linkedin ? (
            <a href={author.social.linkedin} target="_blank" rel="noreferrer" className="underline">
              LinkedIn
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
