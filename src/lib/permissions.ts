import 'server-only';
import { Role } from '@/generated/prisma/client';

type Entity =
  | 'university'
  | 'refs'
  | 'user'
  | 'agreement'
  | 'observation'
  | 'contact';
type Action = 'read' | 'write';

export type Permission = `${Action}:${Entity}` | 'read:sensitive';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    'read:university',
    'write:university',
    'read:refs',
    'write:refs',
    'read:user',
    'write:user',
    'read:agreement',
    'write:agreement',
    'read:observation',
    'write:observation',
    'read:contact',
    'write:contact',
    'read:sensitive',
  ],
  [Role.EDITOR]: [
    'read:university',
    'write:university',
    'read:refs',
    'write:refs',
    'read:agreement',
    'write:agreement',
    'read:observation',
    'write:observation',
    'read:contact',
    'write:contact',
  ],
  [Role.VIEWER]: [
    'read:university',
    'read:refs',
    'read:agreement',
    'read:observation',
    'read:contact',
  ],
  [Role.WAITLISTED]: [], // ← was missing entirely
};

const ROLE_PERMISSION_SETS: Record<Role, Set<Permission>> = {
  [Role.ADMIN]: new Set(ROLE_PERMISSIONS[Role.ADMIN]),
  [Role.EDITOR]: new Set(ROLE_PERMISSIONS[Role.EDITOR]),
  [Role.VIEWER]: new Set(ROLE_PERMISSIONS[Role.VIEWER]),
  [Role.WAITLISTED]: new Set(ROLE_PERMISSIONS[Role.WAITLISTED]), // ← was missing
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSION_SETS[role].has(permission);
}

export function buildPermissions(role: Role): Record<Permission, boolean> {
  const allPermissions: Permission[] = [
    'read:university',
    'write:university',
    'read:refs',
    'write:refs',
    'read:user',
    'write:user',
    'read:agreement',
    'write:agreement',
    'read:observation',
    'write:observation',
    'read:contact',
    'write:contact',
    'read:sensitive',
  ];

  return Object.fromEntries(
    allPermissions.map((p) => [p, hasPermission(role, p)])
  ) as Record<Permission, boolean>;
}

export { Role };

/**
 * Solo ADMIN puede modificar roles. Un ADMIN no puede modificar a otro ADMIN
 * (ni a un superusuario). El superusuario puede modificar a cualquiera
 * excepto a otros superusuarios.
 */
export function canModifyUser(
  acting: { role: Role; isSuperuser: boolean },
  target: { role: Role; isSuperuser: boolean }
): boolean {
  if (target.isSuperuser) return false;
  if (acting.isSuperuser) return true;
  if (acting.role !== Role.ADMIN) return false;
  return target.role !== Role.ADMIN;
}

/**
 * Solo el superusuario puede asignar ADMIN.
 */
export function canAssignRole(
  acting: { isSuperuser: boolean },
  newRole: Role
): boolean {
  if (acting.isSuperuser) return true;
  return newRole !== Role.ADMIN;
}
