// src/features/refs/actions.ts
'use server';
import 'server-only';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { refStrategies } from './ref-strategies';
import {
  dbGetUsedColors,
  withRefErrors,
  RefDuplicateError,
  RefInUseError,
  RefNotFoundError,
  dbCreateBeneficiary,
  dbDeleteBeneficiary,
  dbGetBeneficiaryUsedColors,
  dbUpdateBeneficiary,
} from './db';
import { pickNextColor } from '@/lib/color-palette';
import { FormState } from '@/lib/form-utils';
import { checkPermission } from '@/lib/authz';
import {
  beneficiaryInputSchema,
  refInputSchema,
  TABLE_COLOR_OFFSETS,
  type RefTableName,
  RefInput,
  BeneficiaryInput,
} from './schemas';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * If the user submitted '', server picks from the palette.
 * Otherwise the schema-validated hex is used.
 */
async function resolveColor(
  table: RefTableName,
  rawColor?: string
): Promise<string> {
  if (rawColor) return rawColor;

  const used = await dbGetUsedColors(table);

  // Look up the offset based on the table name, defaulting to 0 just in case
  const offset = TABLE_COLOR_OFFSETS[table] ?? 0;

  // Pass the offset to the function we updated earlier
  return pickNextColor(used, offset);
}

async function resolveBeneficiaryColor(rawColor?: string): Promise<string> {
  if (rawColor) return rawColor;
  const used = await dbGetBeneficiaryUsedColors();
  return pickNextColor(used);
}

export type RefActionState = FormState<keyof RefInput>;

// ── Create ────────────────────────────────────────────────────────────────────

export async function actionCreateRef(
  table: RefTableName,
  prev: RefActionState,
  data: RefInput
): Promise<RefActionState> {
  const authz = await checkPermission('write:refs');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const parsed = refInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      type: 'validation',
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const color = await resolveColor(table, parsed.data.color);
  const strategy = refStrategies[table];

  try {
    await withRefErrors(() =>
      strategy.create({ value: parsed.data.value, color })
    );
    revalidatePath('/settings');
    return { type: 'success', message: 'Valor creado exitosamente.' };
  } catch (e) {
    if (e instanceof RefDuplicateError)
      return {
        type: 'error',
        message: `Ya existe un ${strategy.label.toLowerCase()} con ese nombre.`,
      };
    return { type: 'error', message: 'Error al crear el valor.' };
  }
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function actionUpdateRef(
  id: number,
  table: RefTableName,
  prevState: RefActionState,
  data: RefInput
): Promise<RefActionState> {
  const authz = await checkPermission('write:refs');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  const parsed = refInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      type: 'validation',
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const color = await resolveColor(table, parsed.data.color);
  const strategy = refStrategies[table];

  try {
    await withRefErrors(() =>
      strategy.update(id, { value: parsed.data.value, color })
    );
    revalidatePath('/settings');
    return { type: 'success', message: 'Valor actualizado.' };
  } catch (e) {
    if (e instanceof RefDuplicateError)
      return { type: 'error', message: 'Ya existe un valor con ese nombre.' };
    if (e instanceof RefNotFoundError)
      return { type: 'error', message: 'El valor ya no existe.' };
    return { type: 'error', message: 'Error al actualizar el valor.' };
  }
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function actionDeleteRef(
  id: number,
  table: RefTableName
): Promise<FormState> {
  const authz = await checkPermission('write:refs');
  if (!authz.authorized)
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };

  try {
    const strategy = refStrategies[table];
    await withRefErrors(() => strategy.delete(id));
    revalidatePath('/settings');
    return { type: 'success', message: 'Valor eliminado.' };
  } catch (e) {
    if (e instanceof RefInUseError)
      return {
        type: 'error',
        message:
          'No se puede eliminar: existen registros que dependen de este valor.',
      };
    if (e instanceof RefNotFoundError)
      return { type: 'error', message: 'El valor ya no existe.' };
    return { type: 'error', message: 'Error al eliminar el valor.' };
  }
}

export type BeneficiaryActionState = FormState<keyof BeneficiaryInput>;

// ── Create ────────────────────────────────────────────────────────────────────

export async function actionCreateBeneficiary(
  _prev: BeneficiaryActionState,
  data: BeneficiaryInput
): Promise<BeneficiaryActionState> {
  const authz = await checkPermission('write:refs');
  if (!authz.authorized) {
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };
  }

  const parsed = beneficiaryInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      type: 'validation',
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const color = await resolveBeneficiaryColor(parsed.data.color);

  try {
    await withRefErrors(() =>
      dbCreateBeneficiary({
        cve: parsed.data.cve,
        value: parsed.data.value,
        color,
      })
    );
    revalidatePath('/settings');
    return { type: 'success', message: 'Escuela beneficiaria agregada.' };
  } catch (e) {
    if (e instanceof RefDuplicateError) {
      return {
        type: 'error',
        message: 'Ya existe una escuela con ese nombre o CVE.',
      };
    }
    return { type: 'error', message: 'Error al agregar la escuela.' };
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function actionUpdateBeneficiary(
  id: number,
  _prev: BeneficiaryActionState,
  data: BeneficiaryInput
): Promise<BeneficiaryActionState> {
  const authz = await checkPermission('write:refs');
  if (!authz.authorized) {
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };
  }

  const parsed = beneficiaryInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      type: 'validation',
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const color = await resolveBeneficiaryColor(parsed.data.color);

  try {
    await withRefErrors(() =>
      dbUpdateBeneficiary(id, {
        cve: parsed.data.cve,
        value: parsed.data.value,
        color,
      })
    );
    revalidatePath('/settings');
    return { type: 'success', message: 'Escuela beneficiaria actualizada.' };
  } catch (e) {
    if (e instanceof RefDuplicateError)
      return {
        type: 'error',
        message: 'Ya existe una escuela con ese nombre o CVE.',
      };
    if (e instanceof RefNotFoundError)
      return { type: 'error', message: 'La escuela ya no existe.' };
    return { type: 'error', message: 'Error al actualizar la escuela.' };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function actionDeleteBeneficiary(id: number): Promise<FormState> {
  const authz = await checkPermission('write:refs');
  if (!authz.authorized) {
    return {
      type: 'error',
      message: 'No tienes permiso para realizar esta acción.',
    };
  }

  try {
    await withRefErrors(() => dbDeleteBeneficiary(id));
    revalidatePath('/settings');
    return { type: 'success', message: 'Escuela beneficiaria eliminada.' };
  } catch (e) {
    if (e instanceof RefInUseError) {
      return {
        type: 'error',
        message:
          'No se puede eliminar: existen convenios que dependen de esta escuela.',
      };
    }
    if (e instanceof RefNotFoundError)
      return { type: 'error', message: 'La escuela ya no existe.' };
    return { type: 'error', message: 'Error al eliminar la escuela.' };
  }
}
