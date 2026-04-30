// lib/role.ts
// All role constants and the Role type live in enums.ts.
// This file owns runtime logic: parseRole and the assignable subset.

import { ROLE_OPTIONS, type Role } from '@/lib/enums';

// Roles an admin can assign to other users — excludes WAITLISTED
// because that is a system state, not something you assign intentionally.
export const ASSIGNABLE_ROLES = ['ADMIN', 'EDITOR', 'VIEWER'] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

// Re-export ALL_ROLES as an alias so existing imports don't break.
export const ALL_ROLES = ROLE_OPTIONS;

const VALID_ROLES = new Set<string>(ROLE_OPTIONS);

/**
 * Safely parse a role string from an untrusted source (session, DB row, etc.).
 * Returns WAITLISTED as the least-privilege fallback for unknown values.
 */
export function parseRole(value: string | null | undefined): Role {
  if (value && VALID_ROLES.has(value)) return value as Role;
  return 'WAITLISTED';
}
