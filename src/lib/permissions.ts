import 'server-only';
import { Role } from '@/generated/prisma/client';

export type Permission =
  | 'university:view'
  | 'university:edit'
  | 'university:delete'
  | 'user:view'
  | 'user:invite'
  | 'user:remove'
  | 'user:change_role'
  | 'agreement:view'
  | 'agreement:create'
  | 'agreement:edit'
  | 'agreement:delete'
  | 'manage:all';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    'manage:all',
    'university:view',
    'university:edit',
    'university:delete',
    'user:view',
    'user:invite',
    'user:remove',
    'user:change_role',
    'agreement:view',
    'agreement:create',
    'agreement:edit',
    'agreement:delete',
  ],
  [Role.EDITOR]: [
    'university:view',
    'university:edit',
    'user:view',
    'user:invite',
    'agreement:view',
    'agreement:create',
    'agreement:edit',
    'agreement:delete',
  ],
  [Role.VIEWER]: [
    'university:view', // ← removed the leading =
    'agreement:view',
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
  const set = ROLE_PERMISSION_SETS[role];
  return set.has('manage:all') || set.has(permission);
}

export function buildPermissions(role: Role): Record<Permission, boolean> {
  const allPermissions: Permission[] = [
    'manage:all',
    'university:view',
    'university:edit',
    'university:delete',
    'user:view',
    'user:invite',
    'user:remove',
    'user:change_role',
    'agreement:view',
    'agreement:create',
    'agreement:edit',
    'agreement:delete',
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
