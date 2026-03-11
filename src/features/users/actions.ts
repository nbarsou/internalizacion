'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/authn';
import { requirePermission } from '@/lib/authz';
import type { FormState } from '@/lib/form-utils';
import { changeRoleSchema } from './schemas';
import {
  dbUpdateUserRole,
  dbRemoveUser,
  UserNotFoundError,
  CannotModifySelfError,
} from './db';
import { Role } from '@/generated/prisma/client';

// ── Change role ───────────────────────────────────────────────────────────────

export type ChangeRoleTFields = 'role';
export type ChangeRoleActionState = FormState<ChangeRoleTFields>;

export async function changeUserRoleAction(
  targetUserId: string,
  prevState: ChangeRoleActionState,
  formData: FormData
): Promise<ChangeRoleActionState> {
  // 1. AuthN + AuthZ
  const { userId } = await verifySession();
  await requirePermission('member:change_role');

  // 2. Parse
  const rawData = { role: formData.get('role') };

  // 3. Validate
  const validated = changeRoleSchema.safeParse(rawData);
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  // 4. Mutate
  try {
    // dbUpdateUserRole now handles both updating the role AND deleting
    // the user's sessions in a single Prisma transaction.
    await dbUpdateUserRole(targetUserId, userId, validated.data.role as Role);

    revalidatePath('/admin');
    return { success: true, message: 'Rol actualizado correctamente.' };
  } catch (error) {
    if (error instanceof CannotModifySelfError) {
      return { success: false, message: 'No puedes modificar tu propio rol.' };
    }
    if (error instanceof UserNotFoundError) {
      return { success: false, message: 'Usuario no encontrado.' };
    }
    console.error('[changeUserRoleAction]:', error);
    return {
      success: false,
      message: 'Error al actualizar el rol. Inténtalo de nuevo.',
    };
  }
}

// ── Remove user ───────────────────────────────────────────────────────────────
// Not useActionState — called with useTransition from the delete modal.
// Returns a simple success/message shape instead of FormState.

export async function removeUserAction(
  targetUserId: string
): Promise<{ success: boolean; message: string }> {
  // 1. AuthN + AuthZ
  const { userId } = await verifySession();
  await requirePermission('member:remove');

  // 2. Mutate
  try {
    // dbRemoveUser should now handle both deleting the user AND
    // deleting their active sessions in a Prisma transaction.
    await dbRemoveUser(targetUserId, userId);

    revalidatePath('/admin');
    return { success: true, message: 'Usuario eliminado correctamente.' };
  } catch (error) {
    if (error instanceof CannotModifySelfError) {
      return { success: false, message: 'No puedes eliminarte a ti mismo.' };
    }
    if (error instanceof UserNotFoundError) {
      return { success: false, message: 'Usuario no encontrado.' };
    }
    console.error('[removeUserAction]:', error);
    return {
      success: false,
      message: 'Error al eliminar el usuario. Inténtalo de nuevo.',
    };
  }
}
