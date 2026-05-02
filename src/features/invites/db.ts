import 'server-only';
import { prisma } from '@/lib/prisma';
import { InviteInput } from './schemas';

// ── Error classes ─────────────────────────────────────────────────────────────

export class InviteAlreadyExistsError extends Error {}

// ── Accept (called from better-auth onSignIn hook in lib/auth.ts) ─────────────

export async function dbAcceptPendingInvite(email: string, userId: string) {
  const invite = await prisma.pendingInvite.findUnique({ where: { email } });
  if (!invite) return; // no invite — user keeps default WAITLISTED role

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    await prisma.pendingInvite.delete({ where: { email } });
    return; // queda WAITLISTED
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        role: invite.role,
        permissionExpiresAt: invite.expiresAt,
      },
    }),
    prisma.pendingInvite.delete({ where: { email } }),
  ]);
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function dbCreateInvite(data: InviteInput, createdBy: string) {
  // Block if a live account already exists for this email
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing)
    throw new InviteAlreadyExistsError(
      'Este correo ya tiene una cuenta activa.'
    );

  // Upsert so re-inviting the same email just updates the role/expiry
  return prisma.pendingInvite.upsert({
    where: { email: data.email },
    update: { role: data.role, expiresAt: data.expiresAt, createdBy },
    create: {
      email: data.email,
      role: data.role,
      expiresAt: data.expiresAt,
      createdBy,
    },
  });
}
// ── Read ──────────────────────────────────────────────────────────────────────

export async function dbGetPendingInvites() {
  return prisma.pendingInvite.findMany({
    include: { creator: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export type PendingInvite = Awaited<
  ReturnType<typeof dbGetPendingInvites>
>[number];

// ── Delete ────────────────────────────────────────────────────────────────────

export async function dbDeleteInvite(id: string) {
  await prisma.pendingInvite.delete({ where: { id } });
}
