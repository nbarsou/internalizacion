'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { agreementSchema } from './schemas';
import type { AgreementFormValues } from './schemas';

// ── Result type ───────────────────────────────────────────────────────────────

export type AgreementActionResult =
  | { success: true }
  | {
      success: false;
      fieldErrors: Partial<Record<string, string>>;
      formError?: string;
    };

function collectErrors(
  err: import('zod/v4').ZodError
): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {};
  for (const issue of err.issues) {
    const key = (issue.path[0] as string | undefined) ?? 'root';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function actionCreateAgreement(
  universityId: string,
  universitySlug: string,
  rawData: unknown
): Promise<AgreementActionResult> {
  const parsed = agreementSchema.safeParse(rawData);
  if (!parsed.success)
    return { success: false, fieldErrors: collectErrors(parsed.error) };

  const data: AgreementFormValues = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const agreement = await tx.agreement.create({
        data: {
          universityId,
          typeId: data.typeId,
          statusId: data.statusId,
          spots: data.spots,
          link_convenio: data.link_convenio || null,
        },
      });

      if (data.attrIds.length > 0) {
        await tx.agreementAttr.createMany({
          data: data.attrIds.map((attrId) => ({
            agreementId: agreement.id,
            attrId,
          })),
        });
      }
      if (data.beneficiaryIds.length > 0) {
        await tx.agreementBeneficiary.createMany({
          data: data.beneficiaryIds.map((beneficiaryId) => ({
            agreementId: agreement.id,
            beneficiaryId,
          })),
        });
      }
    });

    revalidatePath(`/universities/${universitySlug}`);
  } catch {
    return {
      success: false,
      fieldErrors: {},
      formError: 'Error al guardar. Intenta de nuevo.',
    };
  }

  redirect(`/universities/${universitySlug}`);
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function actionUpdateAgreement(
  id: string,
  universityId: string,
  universitySlug: string,
  rawData: unknown
): Promise<AgreementActionResult> {
  const parsed = agreementSchema.safeParse(rawData);
  if (!parsed.success)
    return { success: false, fieldErrors: collectErrors(parsed.error) };

  const data: AgreementFormValues = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // Verify ownership before update (IDOR guard)
      const existing = await tx.agreement.findFirstOrThrow({
        where: { id, universityId, deletedAt: null },
      });

      await tx.agreement.update({
        where: { id: existing.id },
        data: {
          typeId: data.typeId,
          statusId: data.statusId,
          spots: data.spots,
          link_convenio: data.link_convenio || null,
        },
      });

      // Replace junction tables atomically
      await tx.agreementAttr.deleteMany({ where: { agreementId: id } });
      if (data.attrIds.length > 0) {
        await tx.agreementAttr.createMany({
          data: data.attrIds.map((attrId) => ({ agreementId: id, attrId })),
        });
      }

      await tx.agreementBeneficiary.deleteMany({ where: { agreementId: id } });
      if (data.beneficiaryIds.length > 0) {
        await tx.agreementBeneficiary.createMany({
          data: data.beneficiaryIds.map((beneficiaryId) => ({
            agreementId: id,
            beneficiaryId,
          })),
        });
      }
    });

    revalidatePath(`/universities/${universitySlug}`);
  } catch {
    return {
      success: false,
      fieldErrors: {},
      formError: 'Error al guardar. Intenta de nuevo.',
    };
  }

  redirect(`/universities/${universitySlug}`);
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function actionDeleteAgreement(
  id: string,
  universityId: string
): Promise<AgreementActionResult> {
  try {
    const result = await prisma.agreement.updateMany({
      where: { id, universityId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      return {
        success: false,
        fieldErrors: {},
        formError: 'Convenio no encontrado.',
      };
    }
    revalidatePath(`/universities`);
    return { success: true };
  } catch {
    return {
      success: false,
      fieldErrors: {},
      formError: 'Error al eliminar. Intenta de nuevo.',
    };
  }
}
