'use server';

import { revalidatePath } from 'next/cache';
import { refStrategies } from './ref-strategies';
import type { RefTableName } from './ref-strategies';

// ── Shared result type ────────────────────────────────────────────────────────

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

// ── Create ────────────────────────────────────────────────────────────────────

export async function actionCreateRef(
  table: RefTableName,
  rawData: unknown
): Promise<ActionResult> {
  const strategy = refStrategies[table];
  const parsed = strategy.createSchema.safeParse(rawData);

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: message };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (strategy.create as (d: any) => Promise<unknown>)(parsed.data);
    revalidatePath('/settings');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    // Unique constraint → friendly message
    if (msg.includes('Unique constraint')) {
      return {
        success: false,
        error: `Ya existe un valor con ese ${strategy.label.toLowerCase()}.`,
      };
    }
    return { success: false, error: msg };
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function actionUpdateRef(
  table: RefTableName,
  id: number,
  rawData: unknown
): Promise<ActionResult> {
  const strategy = refStrategies[table];
  const parsed = strategy.createSchema.safeParse(rawData);

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: message };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (strategy.update as (id: number, d: any) => Promise<unknown>)(
      id,
      parsed.data
    );
    revalidatePath('/settings');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    if (msg.includes('Unique constraint')) {
      return { success: false, error: `Ya existe un valor con ese nombre.` };
    }
    return { success: false, error: msg };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function actionDeleteRef(
  table: RefTableName,
  id: number
): Promise<ActionResult> {
  const strategy = refStrategies[table];

  try {
    await strategy.delete(id);
    revalidatePath('/settings');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    if (msg.includes('Foreign key constraint')) {
      return {
        success: false,
        error: `No se puede eliminar: existen registros que dependen de este valor.`,
      };
    }
    return { success: false, error: msg };
  }
}
