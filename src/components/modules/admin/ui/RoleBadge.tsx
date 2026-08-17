import type { EditorialRole } from '@/@types/editorial';

const ROLE_STYLES: Record<EditorialRole, string> = {
  owner: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  editor: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  author: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  contributor: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
};

interface RoleBadgeProps {
  role: EditorialRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[role]} ${className ?? ''}`}
    >
      {role}
    </span>
  );
}
