import 'server-only';

import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma/client';

// ── Custom error classes ──────────────────────────────────────────────────────

export class UserNotFoundError extends Error {}
export class CannotModifySelfError extends Error {}

// ── Types ─────────────────────────────────────────────────────────────────────

// Inferred return type — import wherever you need to type a user prop.
export type AdminUser = Awaited<ReturnType<typeof dbGetUsers>>[number];

// ── Read functions ────────────────────────────────────────────────────────────

export async function dbGetUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      emailVerified: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function dbGetUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });
}

// ── Write functions ───────────────────────────────────────────────────────────

export async function dbUpdateUserRole(
  targetUserId: string,
  actingUserId: string,
  newRole: Role
) {
  // Prevent admins from demoting themselves — would lock them out.
  if (targetUserId === actingUserId) throw new CannotModifySelfError();

  await prisma.$transaction(async (tx) => {
    // 1. Update the user's role
    const result = await tx.user.updateMany({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    if (result.count === 0) throw new UserNotFoundError();

    // 2. Revoke all active sessions for this user directly in the DB.
    // The next time they try to load a page, Better-Auth won't find
    // their session in the DB, forcing them to log in again to get the new role.
    await tx.session.deleteMany({
      where: { userId: targetUserId },
    });
  });
}

// Demotes user to WAITLISTED rather than deleting the auth record.
// Deleting would orphan BetterAuth sessions and cause errors on their next request.
export async function dbRemoveUser(targetUserId: string, actingUserId: string) {
  if (targetUserId === actingUserId) throw new CannotModifySelfError();

  await prisma.$transaction(async (tx) => {
    // 1. Demote the user
    const result = await tx.user.updateMany({
      where: { id: targetUserId },
      data: { role: Role.WAITLISTED },
    });

    if (result.count === 0) throw new UserNotFoundError();

    // 2. Wipe their active sessions
    // This forces their next page navigation to hit `verifySession`,
    // realize they have no active session, and trigger a fresh login
    // flow that will catch their new WAITLISTED role.
    await tx.session.deleteMany({
      where: { userId: targetUserId },
    });
  });
}
