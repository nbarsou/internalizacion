// lib/role.ts
import type { Role } from '@/generated/prisma/client'; // 'type' prevents bundle crash!

// ── Single Source of Truth for Roles ──────────────────────────────────────────
// Defined as const arrays so they are safe to use in Client Components (Zod).

export const ASSIGNABLE_ROLES = ['ADMIN', 'EDITOR', 'VIEWER'] as const;
export const ALL_ROLES = [...ASSIGNABLE_ROLES, 'WAITLISTED'] as const;

const VALID_ROLES = new Set<string>(ALL_ROLES);

export function parseRole(value: string | null | undefined): Role {
  if (value && VALID_ROLES.has(value)) return value as Role;
  return 'WAITLISTED'; // safe default — unknown role = least privilege
}
