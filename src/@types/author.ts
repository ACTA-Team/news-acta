export interface Author {
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
}

export interface AuthorCardProps {
  author: Author;
  compact?: boolean;
}
