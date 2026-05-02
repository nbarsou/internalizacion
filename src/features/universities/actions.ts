'use server';
import 'server-only';

import { revalidatePath } from 'next/cache';
import { univeristySchema, UniversityInput } from './schemas';
import { redirect } from 'next/navigation';
import { FormState } from '@/lib/form-utils';
import { checkPermission } from '@/lib/authz';
import z from 'zod';
import {
  dbCreateUniversity,
  dbDeleteUniversity,
  dbUpdateUniversity,
  validateRefs,
} from './db';
import { slugSchema } from '@/lib/schemas';

export type UniversityActionResult = FormState<keyof UniversityInput>;

// ── Create ────────────────────────────────────────────────────────────────────

export async function createUniversityAction(
  prevState: UniversityActionResult,
  data: UniversityInput
): Promise<UniversityActionResult> {
  const authz = await checkPermission('write:university');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  // 1. Zod validation
  const validatedFields = univeristySchema.safeParse(data);
  if (!validatedFields.success)
    return {
      type: 'validation',
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };

  let university: Awaited<ReturnType<typeof dbCreateUniversity>>;
  try {
    // 2. FK reference validation
    await validateRefs(validatedFields.data);

    // 3. Create
    university = await dbCreateUniversity(validatedFields.data);

    revalidatePath('/universities');
  } catch (error) {
    console.error('[createTournamentAction]:', error);
    return {
      type: 'error',
      message:
        'Algo salió mal al crear el torneo. Por favor, inténtalo de nuevo.',
    };
  }

  redirect(`/universities/${university.slug}`);
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateUniversityAction(
  slug: string,
  prevState: UniversityActionResult,
  data: UniversityInput
): Promise<UniversityActionResult> {
  const slugParsed = slugSchema.safeParse(slug);
  if (!slugParsed.success) return { type: 'error', message: 'Algo salio mal!' };

  const authz = await checkPermission('write:university');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const validatedFields = univeristySchema.safeParse(data);
  if (!validatedFields.success) {
    console.log(validatedFields.error);
    return {
      type: 'validation',
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  try {
    await validateRefs(validatedFields.data);
    await dbUpdateUniversity(slugParsed.data, validatedFields.data);

    revalidatePath('/universities');
    return { type: 'success', message: 'Los cambios quedaron guardados.' };
  } catch (error) {
    console.error('[createTournamentAction]:', error);
    return {
      type: 'error',
      message:
        'Algo salió mal al crear el torneo. Por favor, inténtalo de nuevo.',
    };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

const deleteArgsSchema = z.object({
  id: z.uuid(),
});

export async function deleteUniversityAction(
  agreementId: string
): Promise<FormState> {
  const authz = await checkPermission('write:university');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const parsed = deleteArgsSchema.safeParse({
    id: agreementId,
  });
  if (!parsed.success)
    return { type: 'error', message: '¡Datos inválidos para borrar!' };

  try {
    await dbDeleteUniversity(parsed.data.id);

    revalidatePath(`/universities`);
    redirect(`/universities`);
  } catch {
    return { type: 'error', message: 'Error al eliminar. Intenta de nuevo.' };
  }
}
