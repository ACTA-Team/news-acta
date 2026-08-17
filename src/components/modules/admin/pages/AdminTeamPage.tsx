import { updateTeamMemberRoleAction } from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { EDITORIAL_ROLES } from '@/lib/editorial/permissions';
import { listTeam, requireRole } from '../services/roles.service';
import { fetchAdminNewsFormOptions } from '../services/news.service';
import { RoleBadge } from '../ui/RoleBadge';

/** Owner-only roster. `/admin/team` is also blocked for non-owners in proxy.ts. */
export async function AdminTeamPageContent() {
  const session = await requireRole('owner');
  const supabase = await createClient();

  const [team, options] = await Promise.all([listTeam(), fetchAdminNewsFormOptions(supabase)]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4">
        <h2 className="text-sm font-semibold">What each role can do</h2>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>
            <strong>owner</strong>: everything, including managing this page.
          </li>
          <li>
            <strong>editor</strong>: edit any article, approve reviews, publish, schedule, archive.
          </li>
          <li>
            <strong>author</strong>: create and edit their own articles, submit for review.
          </li>
          <li>
            <strong>contributor</strong>: create and edit their own drafts; cannot see others’
            drafts.
          </li>
        </ul>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Writes as</th>
              <th className="px-4 py-3 text-right">Update</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member) => {
              const isSelf = member.email === session.email;
              return (
                <tr key={member.email} className="border-t align-middle">
                  <td className="px-4 py-3">
                    <div className="font-medium">{member.displayName ?? member.email}</div>
                    {member.displayName ? (
                      <div className="text-xs text-muted-foreground">{member.email}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{member.authorName ?? '-'}</td>
                  <td className="px-4 py-3">
                    <form
                      action={updateTeamMemberRoleAction}
                      className="flex flex-wrap justify-end gap-2"
                    >
                      <input type="hidden" name="email" value={member.email} />
                      <select
                        name="role"
                        defaultValue={member.role}
                        disabled={isSelf}
                        className="h-8 rounded-lg border bg-transparent px-2.5 text-sm disabled:opacity-50"
                      >
                        {EDITORIAL_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <select
                        name="authorId"
                        defaultValue={member.authorId ?? ''}
                        className="h-8 rounded-lg border bg-transparent px-2.5 text-sm"
                      >
                        <option value="">no author</option>
                        {options.authors.map((author) => (
                          <option key={author.id} value={author.id}>
                            {author.name}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        Save
                      </Button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {team.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No team members.</p>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        You cannot change your own role. Ask another owner. Linking a member to an author record is
        what makes “their own articles” resolvable for the author and contributor roles.
      </p>
    </div>
  );
}
