'use server';
import { FormState } from '@/lib/form-utils';
import 'server-only';
import { ObservationInput, observationSchema } from './schemas';
import { checkPermission } from '@/lib/authz';
import { z } from 'zod';
import {
  dbCreateObservation,
  dbDeleteObservation,
  dbUpdateObservation,
  ObservationNotFoundError,
  UniversityNotFoundError,
} from './db';
import { revalidatePath } from 'next/cache';
import { slugSchema } from '@/lib/schemas';

export type ObservationActionState = FormState<keyof ObservationInput>;

export async function createObservationAction(
  slug: string,
  prevState: ObservationActionState,
  data: ObservationInput
): Promise<ObservationActionState> {
  const authz = await checkPermission('write:observation');
  if (!authz.authorized) {
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };
  }

  const validatedFields = observationSchema.safeParse(data);
  if (!validatedFields.success)
    return {
      type: 'validation',
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };

  try {
    await dbCreateObservation(slug, validatedFields.data);
    revalidatePath(`/universities/${slug}`);
    return { type: 'success', message: 'Observación creada!' };
  } catch (error) {
    if (error instanceof UniversityNotFoundError) {
      return { type: 'error', message: 'Algo salío mal! Intenta de nuevo.' };
    }
    console.error('[createObservationAction]:', error);
    return { type: 'error', message: 'Algo salío mal!' };
  }
}

export async function updateObservationAction(
  observationId: string,
  slug: string,
  prevState: ObservationActionState,
  data: ObservationInput
): Promise<ObservationActionState> {
  const authz = await checkPermission('write:observation');
  if (!authz.authorized) {
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };
  }

  const validatedFields = observationSchema.safeParse(data);
  if (!validatedFields.success)
    return {
      type: 'validation',
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };

  try {
    await dbUpdateObservation(observationId, validatedFields.data);
    revalidatePath(`/universities/${slug}`);
    return { type: 'success', message: 'Observación actualizada!' };
  } catch (error) {
    if (error instanceof ObservationNotFoundError) {
      return { type: 'error', message: 'Algo salío mal! Intenta de nuevo.' };
    }
    console.error('[updateObservationAction]:', error);
    return { type: 'error', message: 'Algo salío mal!' };
  }
}

const deleteObservationArgsSchema = z.object({
  id: z.uuid(),
  slug: slugSchema,
});

export async function deleteObservationAction(
  observationId: string,
  slug: string
): Promise<FormState> {
  const authz = await checkPermission('write:observation');
  if (!authz.authorized) {
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };
  }

  const validatedArgs = deleteObservationArgsSchema.safeParse({
    id: observationId,
    slug,
  });
  if (!validatedArgs.success)
    return { type: 'error', message: 'Algo salio mal!' };

  try {
    await dbDeleteObservation(validatedArgs.data.id);
    revalidatePath(`/universities/${slug}`);
    return { type: 'success', message: 'Observación borrada!' };
  } catch (error) {
    if (error instanceof ObservationNotFoundError) {
      return { type: 'error', message: 'Algo salio mal! Intenta de nuevo.' };
    }
    console.error('[deleteObservationAction]:', error);
    return { type: 'error', message: 'Algo salio mal!' };
  }
}
