import 'server-only';

import { prisma } from '@/lib/prisma';
import { Prisma, Role } from '@/generated/prisma/client';
import { canAssignRole, canModifyUser } from '@/lib/permissions';

// ── Custom error classes ──────────────────────────────────────────────────────

export class UserNotFoundError extends Error {}
export class CannotModifySelfError extends Error {}
export class InsufficientRoleError extends Error {}

// ── Helpers ────────────────────────────────────────────────────────────────

async function loadActorAndTarget(
  tx: Prisma.TransactionClient,
  actingUserId: string,
  targetUserId: string
) {
  const [acting, target] = await Promise.all([
    tx.user.findUnique({
      where: { id: actingUserId },
      select: { role: true, isSuperuser: true },
    }),
    tx.user.findUnique({
      where: { id: targetUserId },
      select: { role: true, isSuperuser: true },
    }),
  ]);
  if (!acting || !target) throw new UserNotFoundError();
  return { acting, target };
}

// ── Expiry check (lazy, called in verifySession) ──────────────────────────────

export async function dbCheckAndExpireUser(userId: string): Promise<Role> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, permissionExpiresAt: true, isSuperuser: true },
  });
  if (!user) return 'WAITLISTED';
  if (user.isSuperuser) return user.role as Role; // ← agregar

  // If expiry is set and has passed, downgrade to WAITLISTED
  if (user.permissionExpiresAt && user.permissionExpiresAt < new Date()) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'WAITLISTED', permissionExpiresAt: null },
    });
    return 'WAITLISTED';
  }

  return user.role as Role;
}

// ── Read ────────────────────────────────────────────────────────────────--

export async function dbGetUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSuperuser: true,
      permissionExpiresAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}
export type UsersDTO = Awaited<ReturnType<typeof dbGetUsers>>[number];

export async function dbGetUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSuperuser: true,
    },
  });
  if (!user) throw new UserNotFoundError();
  return user;
}
export type UserDTO = Awaited<ReturnType<typeof dbGetUserById>>;

// ── Update ────────────────────────────────────────────────────────────────

export async function dbUpdateUserRole(
  actingUserId: string,
  targetUserId: string,
  newRole: Role
) {
  if (actingUserId === targetUserId) throw new CannotModifySelfError();

  await prisma.$transaction(async (tx) => {
    const { acting, target } = await loadActorAndTarget(
      tx,
      actingUserId,
      targetUserId
    );

    if (!canModifyUser(acting, target)) {
      throw new InsufficientRoleError();
    }

    // ← esto es lo nuevo
    if (!canAssignRole(acting, newRole)) {
      throw new InsufficientRoleError(
        'Solo el superusuario puede asignar el rol de administrador.'
      );
    }

    const result = await tx.user.updateMany({
      where: { id: targetUserId },
      data: { role: newRole },
    });
    if (result.count === 0) throw new UserNotFoundError();
  });
}

export async function dbUpdateUserExpirationDate(
  actingUserId: string,
  targetUserId: string,
  newDate: Date | null
) {
  if (actingUserId === targetUserId) throw new CannotModifySelfError();

  await prisma.$transaction(async (tx) => {
    const { acting, target } = await loadActorAndTarget(
      tx,
      actingUserId,
      targetUserId
    );

    if (!canModifyUser(acting, target)) {
      throw new InsufficientRoleError();
    }

    const result = await tx.user.updateMany({
      where: { id: targetUserId },
      data: { permissionExpiresAt: newDate },
    });
    if (result.count === 0) throw new UserNotFoundError();
  });
}
