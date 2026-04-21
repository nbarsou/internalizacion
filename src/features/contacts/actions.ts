'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ContactNotFoundError } from '@/features/contacts/db';
import { contactSchema } from './schemas';
import z from 'zod';

export type ContactActionResult =
  | { success: true }
  | {
      success: false;
      fieldErrors: Partial<Record<string, string>>;
      formError?: string;
    };

function collectErrors(err: z.ZodError): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {};
  for (const issue of err.issues) {
    const key = (issue.path[0] as string | undefined) ?? 'root';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function actionCreateContact(
  universityId: string,
  rawData: unknown
): Promise<ContactActionResult> {
  const parsed = contactSchema.safeParse(rawData);
  if (!parsed.success)
    return { success: false, fieldErrors: collectErrors(parsed.error) };

  try {
    await prisma.contact.create({
      data: {
        universityId,
        concernType: parsed.data.concernType,
        valueType: parsed.data.valueType,
        value: parsed.data.value,
        name: parsed.data.name || null,
      },
    });
    revalidatePath(`/universities`);
    return { success: true };
  } catch {
    return {
      success: false,
      fieldErrors: {},
      formError: 'Error al guardar. Intenta de nuevo.',
    };
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function actionUpdateContact(
  id: string,
  universityId: string,
  rawData: unknown
): Promise<ContactActionResult> {
  const parsed = contactSchema.safeParse(rawData);
  if (!parsed.success)
    return { success: false, fieldErrors: collectErrors(parsed.error) };

  try {
    const result = await prisma.contact.updateMany({
      where: { id, universityId, deletedAt: null },
      data: {
        concernType: parsed.data.concernType,
        valueType: parsed.data.valueType,
        value: parsed.data.value,
        name: parsed.data.name || null,
      },
    });
    if (result.count === 0) throw new ContactNotFoundError();
    revalidatePath(`/universities`);
    return { success: true };
  } catch (e) {
    if (e instanceof ContactNotFoundError) {
      return {
        success: false,
        fieldErrors: {},
        formError: 'Contacto no encontrado.',
      };
    }
    return {
      success: false,
      fieldErrors: {},
      formError: 'Error al guardar. Intenta de nuevo.',
    };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function actionDeleteContact(
  id: string,
  universityId: string
): Promise<ContactActionResult> {
  try {
    const result = await prisma.contact.updateMany({
      where: { id, universityId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new ContactNotFoundError();
    revalidatePath(`/universities`);
    return { success: true };
  } catch (e) {
    if (e instanceof ContactNotFoundError) {
      return {
        success: false,
        fieldErrors: {},
        formError: 'Contacto no encontrado.',
      };
    }
    return {
      success: false,
      fieldErrors: {},
      formError: 'Error al eliminar. Intenta de nuevo.',
    };
  }
}
