import 'server-only';

import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma/client';

export class UserNotFoundError extends Error {}
export class CannotModifySelfError extends Error {}
export class InsufficientRoleError extends Error {}

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

export async function dbUpdateUserRole(
  actingUser: string,
  userId: string,
  newRole: Role
) {
  if (actingUser === userId) throw new CannotModifySelfError();

  await prisma.$transaction(async (tx) => {
    // Simply update the role. Better-Auth will pick up the change
    // automatically on the user's next request.
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true, isSuperuser: true },
    });
    if (!user) throw new UserNotFoundError();
    if (user.isSuperuser) throw new InsufficientRoleError();

    await tx.user.update({
      where: { id: userId },
      data: {
        role: newRole,
      },
    });
  });
}

export async function dbUpdateUserExpirationDate(
  actingUser: string,
  userId: string,
  newDate: Date | null
) {
  if (actingUser === userId) throw new CannotModifySelfError();

  await prisma.$transaction(async (tx) => {
    // Simply update the role. Better-Auth will pick up the change
    // automatically on the user's next request.
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true, isSuperuser: true },
    });
    if (!user) throw new UserNotFoundError();
    if (user.isSuperuser) throw new InsufficientRoleError();

    await tx.user.update({
      where: { id: userId },
      data: {
        permissionExpiresAt: newDate,
      },
    });
  });
}

// ── Expiry check (lazy, called in verifySession) ──────────────────────────────

export async function dbCheckAndExpireUser(userId: string): Promise<Role> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, permissionExpiresAt: true },
  });
  if (!user) return 'WAITLISTED';

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
