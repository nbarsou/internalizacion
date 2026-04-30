'use server';
import 'server-only';

import { revalidatePath } from 'next/cache';
import { z } from 'zod/v4';
import { checkPermission } from '@/lib/authz';
import { ROLE_OPTIONS, type Role } from '@/lib/enums';
import {
  dbUpdateUserRole,
  CannotModifySelfError,
  InsufficientRoleError,
  UserNotFoundError,
  dbUpdateUserExpirationDate,
} from './db';
import { FormState } from '@/lib/form-utils';

const changeRoleArgsSchema = z.object({
  targetUserId: z.cuid(),
  role: z.enum(ROLE_OPTIONS, { error: 'Rol inválido' }),
});

export async function changeUserRoleAction(
  targetUserId: string,
  newRole: Role
): Promise<FormState> {
  const authz = await checkPermission('user:change_role');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const parsedArgs = changeRoleArgsSchema.safeParse({
    targetUserId: targetUserId,
    role: newRole,
  });
  if (!parsedArgs.success) {
    return {
      type: 'error',
      message: 'Algo salio mal!',
    };
  }
  try {
    await dbUpdateUserRole(
      authz.userId,
      parsedArgs.data.targetUserId,
      parsedArgs.data.role
    );
    revalidatePath('/users');
    return { type: 'success', message: 'Rol actualizado correctamente.' };
  } catch (e) {
    if (e instanceof CannotModifySelfError)
      return { type: 'error', message: 'No puedes modificar tu propio rol.' };
    if (e instanceof InsufficientRoleError)
      return {
        type: 'error',
        message: 'No puedes asignar un rol igual o superior al tuyo.',
      };
    if (e instanceof UserNotFoundError)
      return { type: 'error', message: 'Usuario no encontrado.' };
    return { type: 'error', message: 'Error al actualizar el rol.' };
  }
}

const updateExpirySchema = z
  .object({
    targetUserId: z.string().min(1),
    newDate: z.date().optional(),
  })
  .refine((data) => {
    if (data.newDate) {
      return new Date() < data.newDate;
    }
    return true;
  });

export async function updateUserExpiryAction(
  targetUserId: string,
  newDate: string
): Promise<FormState> {
  const authz = await checkPermission('user:change_role');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const validatedFields = updateExpirySchema.safeParse({
    targetUserId: targetUserId,
    newDate:
      typeof newDate === 'string' && newDate ? new Date(newDate) : undefined,
  });
  if (!validatedFields.success) {
    console.error(validatedFields.error);
    return { type: 'error', message: 'Fecha inválida.' };
  }

  try {
    await dbUpdateUserExpirationDate(
      authz.userId,
      validatedFields.data.targetUserId,
      validatedFields.data.newDate ?? null
    );
    revalidatePath('/users');
    return { type: 'success', message: 'Fecha actualizada.' };
  } catch (error) {
    if (error instanceof CannotModifySelfError)
      return { type: 'error', message: 'No puedes modificarte a ti mismo.' };
    if (error instanceof InsufficientRoleError)
      return { type: 'error', message: 'Permisos insuficientes.' };
    if (error instanceof UserNotFoundError)
      return { type: 'error', message: 'Usuario no encontrado.' };
    return { type: 'error', message: 'Error al actualizar la fecha.' };
  }
}
