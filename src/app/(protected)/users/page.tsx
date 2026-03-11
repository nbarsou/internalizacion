import { verifySession } from '@/lib/authn';
import { requirePermission } from '@/lib/authz';
import { dbGetUsers } from '@/features/users/db';
import { UserTable } from '@/features/users/components/user-table';

export const metadata = { title: 'Administración de usuarios' };

export default async function AdminPage() {
  // requirePermission calls verifySession internally, but we also need userId
  // to mark the current user's row in the table. Call both — verifySession is
  // wrapped in React cache() so the second call is free (no extra DB round-trip).
  const [{ userId }, { can }] = await Promise.all([
    verifySession(),
    requirePermission('member:view'),
  ]);

  const users = await dbGetUsers();

  return (
    <div className="space-y-6 p-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            { label: 'Total', filter: () => true },
            {
              label: 'Admins',
              filter: (u: (typeof users)[number]) => u.role === 'ADMIN',
            },
            {
              label: 'Editores',
              filter: (u: (typeof users)[number]) => u.role === 'EDITOR',
            },
            {
              label: 'En espera',
              filter: (u: (typeof users)[number]) => u.role === 'WAITLISTED',
            },
          ] as const
        ).map(({ label, filter }) => (
          <div key={label} className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="mt-1 text-2xl font-semibold">
              {users.filter(filter).length}
            </p>
          </div>
        ))}
      </div>

      <UserTable users={users} currentUserId={userId} can={can} />
    </div>
  );
}
