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
  dbGetUniversityBySlug,
  dbUpdateUniversity,
  validateRefs,
} from './db';
import { slugSchema } from '@/lib/schemas';
import { createAuditLog } from '@/lib/audit';

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

  const validatedFields = univeristySchema.safeParse(data);
  if (!validatedFields.success)
    return {
      type: 'validation',
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };

  let university: Awaited<ReturnType<typeof dbCreateUniversity>>;
  try {
    await validateRefs(validatedFields.data);
    university = await dbCreateUniversity(validatedFields.data);

    createAuditLog({
      userId: authz.userId,
      action: 'create',
      entity: 'university',
      entityId: university.slug,
      after: validatedFields.data,
    });

    revalidatePath('/universities');
  } catch (error) {
    console.error('[createUniversityAction]:', error);
    return {
      type: 'error',
      message:
        'Algo salió mal al crear la institución. Por favor, inténtalo de nuevo.',
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
  if (!validatedFields.success)
    return {
      type: 'validation',
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };

  try {
    const before = await dbGetUniversityBySlug(slugParsed.data);

    await validateRefs(validatedFields.data);
    await dbUpdateUniversity(slugParsed.data, validatedFields.data);

    createAuditLog({
      userId: authz.userId,
      action: 'update',
      entity: 'university',
      entityId: slugParsed.data,
      before: {
        name: before.name,
        start: before.start,
        expires: before.expires,
        isCatholic: before.isCatholic,
        web_page: before.web_page,
        city: before.city,
        address: before.address,
        lat: before.lat,
        lng: before.lng,
        regionId: before.regionId,
        countryId: before.countryId,
        institutionTypeId: before.institutionTypeId,
        campusId: before.campusId,
        utilizationId: before.utilizationId,
      },
      after: validatedFields.data,
    });

    revalidatePath('/universities');
    return { type: 'success', message: 'Los cambios quedaron guardados.' };
  } catch (error) {
    console.error('[updateUniversityAction]:', error);
    return {
      type: 'error',
      message:
        'Algo salió mal al actualizar la institución. Por favor, inténtalo de nuevo.',
    };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

const deleteArgsSchema = z.object({ id: z.uuid() });

export async function deleteUniversityAction(
  universityId: string
): Promise<FormState> {
  const authz = await checkPermission('write:university');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const parsed = deleteArgsSchema.safeParse({ id: universityId });
  if (!parsed.success)
    return { type: 'error', message: '¡Datos inválidos para borrar!' };

  try {
    await dbDeleteUniversity(parsed.data.id);

    createAuditLog({
      userId: authz.userId,
      action: 'delete',
      entity: 'university',
      entityId: parsed.data.id,
    });

    revalidatePath('/universities');
  } catch {
    return { type: 'error', message: 'Error al eliminar. Intenta de nuevo.' };
  }
  redirect('/universities');
}
