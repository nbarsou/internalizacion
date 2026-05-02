'use server';
import 'server-only';

import { revalidatePath } from 'next/cache';
import { agreementSchema, AgreementInput } from './schemas';
import { FormState } from '@/lib/form-utils';
import { checkPermission } from '@/lib/authz';
import { z } from 'zod';
import { slugSchema } from '@/lib/schemas';
import {
  validateAgreementRefs,
  dbCreateAgreement,
  ReferenceValidationError,
  dbUpdateAgreement,
  dbDeleteAgreement,
} from './db';

export type AgreementActionResult = FormState<keyof AgreementInput>;

// ── Create ────────────────────────────────────────────────────────────────────

export async function createAgreementAction(
  universityId: string,
  universitySlug: string,
  prevState: AgreementActionResult,
  data: AgreementInput
): Promise<AgreementActionResult> {
  const authz = await checkPermission('write:agreement');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  // Re-validate on the server — never trust client data even with RHF
  const result = agreementSchema.safeParse(data);
  if (!result.success)
    return {
      type: 'validation',
      errors: z.flattenError(result.error).fieldErrors,
    };

  try {
    await validateAgreementRefs(result.data);
    await dbCreateAgreement(universityId, result.data);
    revalidatePath('/agreements');
    revalidatePath(`/universities/${universitySlug}`);
    return { type: 'success', message: 'Convenio creado con éxito.' };
  } catch (error) {
    console.error('[createAgreementAction]:', error);
    if (error instanceof ReferenceValidationError)
      return { type: 'error', message: error.message };
    return {
      type: 'error',
      message: 'Algo salió mal al crear el convenio. Inténtalo de nuevo.',
    };
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateAgreementAction(
  agreementId: string,
  universitySlug: string,
  prevState: AgreementActionResult,
  data: AgreementInput
): Promise<AgreementActionResult> {
  const authz = await checkPermission('write:agreement');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const result = agreementSchema.safeParse(data);
  if (!result.success)
    return {
      type: 'validation',
      errors: z.flattenError(result.error).fieldErrors,
    };

  try {
    await validateAgreementRefs(result.data);
    await dbUpdateAgreement(agreementId, result.data);

    revalidatePath('/agreements');
    revalidatePath(`/universities/${universitySlug}`);
    return { type: 'success', message: 'Convenio actualizado con éxito.' };
  } catch (error) {
    console.error('[updateAgreementAction]:', error);
    if (error instanceof ReferenceValidationError)
      return { type: 'error', message: error.message };
    return {
      type: 'error',
      message: 'Algo salió mal al actualizar el convenio. Inténtalo de nuevo.',
    };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

const deleteArgsSchema = z.object({
  id: z.uuid(),
  slug: slugSchema,
});

export async function deleteAgreementAction(
  agreementId: string,
  universitySlug: string
): Promise<FormState> {
  const authz = await checkPermission('write:agreement');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const parsed = deleteArgsSchema.safeParse({
    id: agreementId,
    slug: universitySlug,
  });
  if (!parsed.success)
    return { type: 'error', message: '¡Datos inválidos para borrar!' };

  try {
    await dbDeleteAgreement(parsed.data.id);
    revalidatePath('/agreements');
    revalidatePath(`/universities/${universitySlug}`);
    return { type: 'success', message: '¡Convenio borrado!' };
  } catch {
    return { type: 'error', message: 'Error al eliminar. Intenta de nuevo.' };
  }
}
