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
  dbGetAgreementById,
  ReferenceValidationError,
  dbUpdateAgreement,
  dbDeleteAgreement,
} from './db';
import { createAuditLog } from '@/lib/audit';

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

  // Validate universityId and slug — never trust caller args
  const parsedId = z.uuid().safeParse(universityId);
  if (!parsedId.success) return { type: 'error', message: 'Algo salio mal!' };

  const parsedSlug = slugSchema.safeParse(universitySlug);
  if (!parsedSlug.success) return { type: 'error', message: 'Algo salio mal!' };

  const result = agreementSchema.safeParse(data);
  if (!result.success)
    return {
      type: 'validation',
      errors: z.flattenError(result.error).fieldErrors,
    };

  try {
    await validateAgreementRefs(result.data);
    const agreement = await dbCreateAgreement(parsedId.data, result.data);

    createAuditLog({
      userId: authz.userId,
      action: 'create',
      entity: 'agreement',
      entityId: agreement.id,
      after: result.data,
    });

    revalidatePath('/agreements');
    revalidatePath(`/universities/${parsedSlug.data}`);
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

  const parsedId = z.uuid().safeParse(agreementId);
  if (!parsedId.success) return { type: 'error', message: 'Algo salio mal!' };

  const parsedSlug = slugSchema.safeParse(universitySlug);
  if (!parsedSlug.success) return { type: 'error', message: 'Algo salio mal!' };

  const result = agreementSchema.safeParse(data);
  if (!result.success)
    return {
      type: 'validation',
      errors: z.flattenError(result.error).fieldErrors,
    };

  try {
    const before = await dbGetAgreementById(parsedId.data);

    await validateAgreementRefs(result.data);
    await dbUpdateAgreement(parsedId.data, result.data);

    createAuditLog({
      userId: authz.userId,
      action: 'update',
      entity: 'agreement',
      entityId: parsedId.data,
      before: before,
      after: result.data,
    });

    revalidatePath('/agreements');
    revalidatePath(`/universities/${parsedSlug.data}`);
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
    const before = await dbGetAgreementById(parsed.data.id);

    await dbDeleteAgreement(parsed.data.id);

    createAuditLog({
      userId: authz.userId,
      action: 'delete',
      entity: 'agreement',
      entityId: parsed.data.id,
      before: before,
    });

    revalidatePath('/agreements');
    revalidatePath(`/universities/${parsed.data.slug}`);
    return { type: 'success', message: '¡Convenio borrado!' };
  } catch {
    return { type: 'error', message: 'Error al eliminar. Intenta de nuevo.' };
  }
}
