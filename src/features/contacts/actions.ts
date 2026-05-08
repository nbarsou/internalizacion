'use server';

import { revalidatePath } from 'next/cache';
import {
  ContactNotFoundError,
  dbCreateContact,
  dbDeleteContact,
  dbGetContactById,
  dbUpdateContact,
  UniversityNotFoundError,
} from '@/features/contacts/db';
import { ContactInput, contactSchema } from './schemas';
import { z } from 'zod';
import { FormState } from '@/lib/form-utils';
import { checkPermission } from '@/lib/authz';
import { slugSchema } from '@/lib/schemas';
import { createAuditLog } from '@/lib/audit';

export type ContactActionResult = FormState<keyof ContactInput>;

// ── Create ────────────────────────────────────────────────────────────────────

export async function actionCreateContact(
  slug: string,
  prevState: ContactActionResult,
  data: ContactInput
): Promise<ContactActionResult> {
  const authz = await checkPermission('write:contact');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const slugParsed = slugSchema.safeParse(slug); // ← was missing
  if (!slugParsed.success) return { type: 'error', message: 'Algo salio mal!' };

  const validatedFields = contactSchema.safeParse(data);
  if (!validatedFields.success)
    return {
      type: 'validation',
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };

  try {
    const contact = await dbCreateContact(
      slugParsed.data,
      validatedFields.data
    );

    createAuditLog({
      userId: authz.userId,
      action: 'create',
      entity: 'contact',
      entityId: contact.id,
      after: validatedFields.data,
    });

    revalidatePath(`/universities/${slugParsed.data}`);
    return { type: 'success', message: 'Contacto creado!' };
  } catch (error) {
    if (error instanceof UniversityNotFoundError)
      return { type: 'error', message: 'Algo salío mal! Intenta de nuevo.' };
    console.error('[actionCreateContact]:', error);
    return { type: 'error', message: 'Algo salío mal!' };
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateContactAction(
  contactId: string,
  slug: string,
  prevState: ContactActionResult,
  data: ContactInput
): Promise<ContactActionResult> {
  const authz = await checkPermission('write:contact');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const parsedId = z.uuid().safeParse(contactId); // ← was missing
  if (!parsedId.success) return { type: 'error', message: 'Algo salio mal!' };

  const slugParsed = slugSchema.safeParse(slug); // ← was missing
  if (!slugParsed.success) return { type: 'error', message: 'Algo salio mal!' };

  const validatedFields = contactSchema.safeParse(data);
  if (!validatedFields.success)
    return {
      type: 'validation',
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };

  try {
    const before = await dbGetContactById(parsedId.data);

    await dbUpdateContact(parsedId.data, slugParsed.data, validatedFields.data);

    createAuditLog({
      userId: authz.userId,
      action: 'update',
      entity: 'contact',
      entityId: parsedId.data,
      before: before,
      after: validatedFields.data,
    });

    revalidatePath(`/universities/${slugParsed.data}`);
    return { type: 'success', message: 'Contacto actualizado!' };
  } catch (error) {
    if (error instanceof ContactNotFoundError)
      return { type: 'error', message: 'Algo salío mal! Intenta de nuevo.' };
    console.error('[updateContactAction]:', error);
    return { type: 'error', message: 'Algo salío mal!' };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

const deleteContactArgsSchema = z.object({
  id: z.uuid(),
  slug: slugSchema,
});

export async function deleteContactAction(
  contactId: string,
  slug: string
): Promise<FormState> {
  const authz = await checkPermission('write:contact');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const validatedArgs = deleteContactArgsSchema.safeParse({
    id: contactId,
    slug,
  });
  if (!validatedArgs.success)
    return { type: 'error', message: 'Algo salio mal!' };

  try {
    const before = await dbGetContactById(validatedArgs.data.id);

    await dbDeleteContact(validatedArgs.data.id);

    createAuditLog({
      userId: authz.userId,
      action: 'delete',
      entity: 'contact',
      entityId: validatedArgs.data.id,
      before: before,
    });

    revalidatePath(`/universities/${validatedArgs.data.slug}`);
    return { type: 'success', message: 'Contacto borrado!' };
  } catch (error) {
    if (error instanceof ContactNotFoundError)
      return { type: 'error', message: 'Algo salio mal! Intenta de nuevo.' };
    console.error('[deleteContactAction]:', error);
    return { type: 'error', message: 'Algo salio mal!' };
  }
}
