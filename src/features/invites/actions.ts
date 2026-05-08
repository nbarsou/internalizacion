'use server';

import { revalidatePath } from 'next/cache';
import { checkPermission } from '@/lib/authz';
import { InviteInput, inviteSchema } from './schemas';
import {
  dbCreateInvite,
  dbDeleteInvite,
  dbGetInviteById,
  InviteAlreadyExistsError,
} from './db';
import { FormState } from '@/lib/form-utils';
import { createAuditLog } from '@/lib/audit';
import z from 'zod';

export type InviteActionState = FormState<keyof InviteInput>;

// ── Create ────────────────────────────────────────────────────────────────────

export async function createInviteAction(
  prevState: InviteActionState,
  data: InviteInput
): Promise<InviteActionState> {
  const authz = await checkPermission('write:user');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const validatedFields = inviteSchema.safeParse(data);
  if (!validatedFields.success) {
    console.error(validatedFields.error); // ← was console.log
    return {
      type: 'validation',
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  try {
    const invite = await dbCreateInvite(validatedFields.data, authz.userId);

    createAuditLog({
      userId: authz.userId,
      action: 'create',
      entity: 'invite',
      entityId: invite.id,
      after: {
        email: validatedFields.data.email,
        role: validatedFields.data.role,
      },
    });

    revalidatePath('/users');
    return {
      type: 'success',
      message: `Invitación registrada para ${validatedFields.data.email}.`,
    };
  } catch (e) {
    if (e instanceof InviteAlreadyExistsError)
      return { type: 'error', message: e.message }; // ← removed unnecessary cast
    console.error(e);
    return { type: 'error', message: 'Error al registrar la invitación.' };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

const deleteInviteArgsSchema = z.object({
  inviteId: z.cuid2(),
});

export async function deleteInviteAction(inviteId: string): Promise<FormState> {
  const authz = await checkPermission('write:user');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const parsedArgs = deleteInviteArgsSchema.safeParse({ inviteId });
  if (!parsedArgs.success) return { type: 'error', message: 'Algo salio mal!' };

  try {
    const before = await dbGetInviteById(parsedArgs.data.inviteId);

    await dbDeleteInvite(parsedArgs.data.inviteId);

    createAuditLog({
      userId: authz.userId,
      action: 'delete',
      entity: 'invite',
      entityId: parsedArgs.data.inviteId,
      before: { email: before.email, role: before.role },
    });

    revalidatePath('/users');
    return { type: 'success', message: 'Invitación eliminada.' };
  } catch {
    return { type: 'error', message: 'Error al eliminar la invitación.' };
  }
}
