import { requirePermission } from '@/lib/authz';
import { dbGetUsers } from '@/features/users/db';
import { dbGetPendingInvites } from '@/features/invites/db';
import { UserManagement } from '@/features/users/components/user-management';
import { InviteManagement } from '@/features/invites/components/invite-management';

export const metadata = { title: 'Administración de usuarios' };

export default async function AdminPage() {
  const { can } = await requirePermission('user:view');

  const [users, pendingInvites] = await Promise.all([
    dbGetUsers(),
    can['user:invite'] ? dbGetPendingInvites() : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      {/* ── Invite section (gated) ─────────────────────────────── */}
      {can['user:invite'] && (
        <section aria-labelledby="invite-heading" className="space-y-3">
          <InviteManagement pendingInvites={pendingInvites} />
        </section>
      )}

      {/* ── User list ──────────────────────────────────────────── */}
      <section aria-labelledby="members-heading" className="space-y-3">
        <UserManagement users={users} can={can} />
      </section>
    </div>
  );
}
