// features/users/schemas.ts
import { z } from 'zod';
import type { Role } from '@/generated/prisma/client';
import { ASSIGNABLE_ROLES } from '@/lib/role'; // 👈 Flowing correctly from lib

// ── Role schema ───────────────────────────────────────────────────────────────

export const changeRoleSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES, { message: 'Selecciona un rol válido' }),
});

export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;

// ── Shared constants ──────────────────────────────────────────────────────────
// Using 'ADMIN' instead of Role.ADMIN because we only imported the type, not the object.
// TypeScript will still enforce these match the Prisma schema perfectly.

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  VIEWER: 'Visualizador',
  WAITLISTED: 'En espera',
};

export const ROLE_BADGE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  EDITOR: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-green-100 text-green-700',
  WAITLISTED: 'bg-gray-100 text-gray-500',
};
