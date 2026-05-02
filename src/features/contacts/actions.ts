'use server';

import { revalidatePath } from 'next/cache';

import {
  ContactNotFoundError,
  dbCreateContact,
  dbDeleteContact,
  dbUpdateContact,
  UniversityNotFoundError,
} from '@/features/contacts/db';
import { ContactInput, contactSchema } from './schemas';

import { z } from 'zod';
import { FormState } from '@/lib/form-utils';
import { checkPermission } from '@/lib/authz';
import { slugSchema } from '@/lib/schemas';

export type ContactActionResult = FormState<keyof ContactInput>;

export async function actionCreateContact(
  slug: string,
  prevState: ContactActionResult,
  data: ContactInput
): Promise<ContactActionResult> {
  const authz = await checkPermission('write:contact');
  if (!authz.authorized) {
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };
  }

  const validatedFields = contactSchema.safeParse(data);
  if (!validatedFields.success)
    return {
      type: 'validation',
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };

  try {
    await dbCreateContact(slug, validatedFields.data);
    revalidatePath(`/universities/${slug}`);
    return { type: 'success', message: 'Contacto creado!' };
  } catch (error) {
    if (error instanceof UniversityNotFoundError) {
      return { type: 'error', message: 'Algo salío mal! Intenta de nuevo.' };
    }
    console.error('[actionCreateContact]:', error);
    return { type: 'error', message: 'Algo salío mal!' };
  }
}

export async function updateContactAction(
  contactId: string,
  slug: string,
  prevState: ContactActionResult,
  data: ContactInput
): Promise<ContactActionResult> {
  const authz = await checkPermission('write:contact');
  if (!authz.authorized) {
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };
  }

  const validatedFields = contactSchema.safeParse(data);
  if (!validatedFields.success)
    return {
      type: 'validation',
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };

  try {
    await dbUpdateContact(contactId, slug, validatedFields.data);
    revalidatePath(`/universities/${slug}`);
    return { type: 'success', message: 'Contacto actualizado!' };
  } catch (error) {
    if (error instanceof ContactNotFoundError) {
      return { type: 'error', message: 'Algo salío mal! Intenta de nuevo.' };
    }
    console.error('[updateContactAction]:', error);
    return { type: 'error', message: 'Algo salío mal!' };
  }
}

const deleteContactArgsSchema = z.object({
  id: z.uuid(),
  slug: slugSchema,
});

export async function deleteContactAction(
  contactId: string,
  slug: string
): Promise<FormState> {
  const authz = await checkPermission('write:contact');
  if (!authz.authorized) {
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };
  }

  const validatedArgs = deleteContactArgsSchema.safeParse({
    id: contactId,
    slug,
  });
  if (!validatedArgs.success)
    return { type: 'error', message: 'Algo salio mal!' };

  try {
    await dbDeleteContact(validatedArgs.data.id);
    revalidatePath(`/universities/${slug}`);
    return { type: 'success', message: 'Contacto borrado!' };
  } catch (error) {
    if (error instanceof ContactNotFoundError) {
      return { type: 'error', message: 'Algo salio mal! Intenta de nuevo.' };
    }
    console.error('[deleteContactAction]:', error);
    return { type: 'error', message: 'Algo salio mal!' };
  }
}
