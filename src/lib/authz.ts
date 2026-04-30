// lib/authz.ts
import 'server-only';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/authn';
import { hasPermission, buildPermissions, Permission } from '@/lib/permissions';

export async function requirePermission(permission: Permission) {
  const { userId, role, isSuperuser } = await verifySession(); // ← already a Role, already validated

  if (!hasPermission(role, permission)) redirect('/403');

  return {
    can: buildPermissions(role),
    actingUserId: userId,
    actingIsSuperuser: isSuperuser,
  };
}

export async function checkPermission(
  permission: Permission
): Promise<
  | { authorized: true; userId: string; can: Record<Permission, boolean> }
  | { authorized: false }
> {
  const { userId, role } = await verifySession();
  if (!hasPermission(role, permission)) return { authorized: false };
  return { authorized: true, userId, can: buildPermissions(role) };
}
