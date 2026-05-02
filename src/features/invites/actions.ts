'use server';

import { revalidatePath } from 'next/cache';
import { checkPermission } from '@/lib/authz';
import { InviteInput, inviteSchema } from './schemas';
import { dbCreateInvite, dbDeleteInvite, InviteAlreadyExistsError } from './db';
import { FormState } from '@/lib/form-utils';
import z from 'zod';

// ── Create ────────────────────────────────────────────────────────────────────

export type InviteActionState = FormState<keyof InviteInput>;

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
    console.log(validatedFields.error);
    return {
      type: 'validation',
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  try {
    await dbCreateInvite(validatedFields.data, authz.userId);
    revalidatePath('/users');
    return {
      type: 'success',
      message: `Invitación registrada para ${validatedFields.data.email}.`,
    };
  } catch (e) {
    if (e instanceof InviteAlreadyExistsError) {
      return { type: 'error', message: (e as Error).message };
    }
    console.error(e);
    return { type: 'error', message: 'Error al registrar la invitación.' };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
const deleteInviteArgsSchema = z.object({
  inviteId: z.cuid(),
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
    await dbDeleteInvite(parsedArgs.data.inviteId);
    revalidatePath('/users');
    return { type: 'success', message: 'Invitación eliminada.' };
  } catch {
    return { type: 'error', message: 'Error al eliminar la invitación.' };
  }
}
