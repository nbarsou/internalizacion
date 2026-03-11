import { Role } from '@/generated/prisma/client';

export type Permission =
  | 'university:view'
  | 'university:edit'
  | 'university:delete'
  | 'member:view'
  | 'member:invite'
  | 'member:remove'
  | 'member:change_role'
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
    'member:view',
    'member:invite',
    'member:remove',
    'member:change_role',
    'agreement:view',
    'agreement:create',
    'agreement:edit',
    'agreement:delete',
  ],
  [Role.EDITOR]: [
    'university:view',
    'university:edit',
    'member:view',
    'member:invite',
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
    'member:view',
    'member:invite',
    'member:remove',
    'member:change_role',
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
