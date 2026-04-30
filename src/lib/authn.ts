// lib/authn.ts
import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { dbCheckAndExpireUser } from '@/features/users/db'; // ← users, not invites
import type { Role } from '@/lib/enums';

export const verifySession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect('/');

  // Lazy expiry check — downgrades role in DB if permissionExpiresAt has passed.
  // Returns the current effective role (may differ from session.user.role if
  // the session was issued before the expiry was reached).
  const role: Role = await dbCheckAndExpireUser(session.user.id);

  // Use the DB-verified role, not session.user.role, for the waitlist gate.
  if (role === 'WAITLISTED') redirect('/waitlist');

  return {
    isAuth: true,
    userId: session.user.id,
    user: session.user,
    role, // Role from DB, not session cache
    isSuperuser:
      (session.user as { isSuperuser?: boolean | null }).isSuperuser ?? false,
  };
});
