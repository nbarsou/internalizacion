'use server';

import { revalidatePath } from 'next/cache';
import { univeristySchema, UniversityFields } from './schemas';
import { redirect } from 'next/navigation';
import { FormState } from '@/lib/form-utils';
import { checkPermission } from '@/lib/authz';
import z from 'zod';
import { dbCreateUniversity, dbUpdateUniversity, validateRefs } from './db';
import { slugSchema } from '@/lib/schemas';
// ── Action ────────────────────────────────────────────────────────────────────

export type UniversityActionState = FormState<UniversityFields>;

export async function createUniversityAction(
  prevState: UniversityActionState,
  formData: FormData
): Promise<UniversityActionState> {
  const authz = await checkPermission('university:create');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const get = (key: UniversityFields) => formData.get(key);

  const startStr = get('start');
  const expiresStr = get('expires');
  const webPageRaw = get('webPage');
  const cityRaw = get('city');
  const addressRaw = get('address');

  const rawData = {
    name: get('name'),
    start:
      typeof startStr === 'string' && startStr ? new Date(startStr) : undefined,
    expires:
      typeof expiresStr === 'string' && expiresStr
        ? new Date(expiresStr)
        : undefined, //optiional
    isCatholic: get('isCatholic') === 'true',
    webPage:
      typeof webPageRaw === 'string' && webPageRaw.trim()
        ? webPageRaw
        : undefined, //Optional
    city: typeof cityRaw === 'string' && cityRaw.trim() ? cityRaw : undefined, //Optional
    address:
      typeof addressRaw === 'string' && addressRaw.trim()
        ? addressRaw
        : undefined, //Optional
    regionId: get('regionId'),
    countryId: get('countryId'),
    institutionTypeId: get('institutionTypeId'),
    campusId: get('campusId'),
    utilizationId: get('utilizationId'),
  };

  // 1. Zod validation
  const validatedFields = univeristySchema.safeParse(rawData);
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

  redirect(`/t/${university.slug}`);
}

export async function updateUniversityAction(
  slug: string,
  prevState: UniversityActionState,
  formData: FormData
): Promise<UniversityActionState> {
  const slugParsed = slugSchema.safeParse(slug);
  if (!slugParsed.success) return { type: 'error', message: 'Algo salio mal!' };

  const authz = await checkPermission('university:edit');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const get = (key: UniversityFields) => formData.get(key);

  const startStr = get('expires');
  const expiresStr = get('expires');
  const webPageRaw = get('webPage');
  const cityRaw = get('city');
  const addressRaw = get('address');

  const rawData = {
    name: get('name'),
    start:
      typeof startStr === 'string' && startStr ? new Date(startStr) : undefined,
    expires:
      typeof expiresStr === 'string' && expiresStr
        ? new Date(expiresStr)
        : undefined, //optiional
    isCatholic: get('isCatholic'),
    webPage:
      typeof webPageRaw === 'string' && webPageRaw.trim()
        ? webPageRaw
        : undefined, //Optional
    city: typeof cityRaw === 'string' && cityRaw.trim() ? cityRaw : undefined, //Optional
    address:
      typeof addressRaw === 'string' && addressRaw.trim()
        ? addressRaw
        : undefined, //Optional
    regionId: get('regionId'),
    countryId: get('countryId'),
    institutionTypeId: get('institutionTypeId'),
    campusId: get('campusId'),
    utilizationId: get('utilizationId'),
  };

  // 1. Zod validation
  const validatedFields = univeristySchema.safeParse(rawData);
  if (!validatedFields.success)
    return {
      type: 'validation',
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };

  try {
    // 2. FK reference validation
    await validateRefs(validatedFields.data);

    // 3. Create
    await dbUpdateUniversity(slug, {
      ...validatedFields.data,
      expires: validatedFields.data.expires ?? null,
      webPage: validatedFields.data.webPage ?? null,
      city: validatedFields.data.city ?? null,
      address: validatedFields.data.address ?? null,
    });

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
