import 'server-only';

import { prisma } from '@/lib/prisma';
import { AgreementInput } from './schemas';

// ── Custom error classes ──────────────────────────────────────────────────────

export class AgreementNotFoundError extends Error {}
export class ReferenceValidationError extends Error {}

// ── Validation ────────────────────────────────────────────────────────────────

export async function validateAgreementRefs(data: AgreementInput) {
  // Check Type and Status
  const [type, status] = await Promise.all([
    prisma.refAgreementType.findUnique({ where: { id: data.typeId } }),
    prisma.refStatus.findUnique({ where: { id: data.statusId } }),
  ]);

  if (!type) throw new ReferenceValidationError();
  if (!status) throw new ReferenceValidationError();

  // Check Attributes
  if (data.attrIds && data.attrIds.length > 0) {
    const attrs = await prisma.refAttr.findMany({
      where: { id: { in: data.attrIds } },
    });
    if (attrs.length !== data.attrIds.length) {
      throw new ReferenceValidationError();
    }
  }

  // Check Beneficiaries
  if (data.beneficiaryIds && data.beneficiaryIds.length > 0) {
    const beneficiaries = await prisma.refBeneficiary.findMany({
      where: { id: { in: data.beneficiaryIds } },
    });
    if (beneficiaries.length !== data.beneficiaryIds.length) {
      throw new ReferenceValidationError();
    }
  }
}

// ── Create ────────────────────────────────────────────────────────────────

export async function dbCreateAgreement(
  universityId: string,
  data: AgreementInput
) {
  return prisma.agreement.create({
    data: {
      universityId,
      typeId: data.typeId,
      statusId: data.statusId,
      spots: data.spots,
      link_convenio: data.link_convenio,
      // Create junction rows for attributes
      attrs: {
        create: data.attrIds?.map((attrId) => ({ attrId })) || [],
      },
      // Create junction rows for beneficiaries
      beneficiaries: {
        create:
          data.beneficiaryIds?.map((beneficiaryId) => ({ beneficiaryId })) ||
          [],
      },
    },
  });
}

export async function dbGetAgreements() {
  return prisma.agreement.findMany({
    include: {
      type: true,
      status: true,
      university: {
        select: {
          id: true,
          name: true, // Changed from 'nombre'
          slug: true,
          country: true, // Changed from 'pais'
          city: true, // Changed from 'ciudad'
        },
      },
      attrs: { include: { attr: true } },
      beneficiaries: { include: { beneficiary: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export type AgreementsDTO = Awaited<ReturnType<typeof dbGetAgreements>>[number];

// Agreements scoped to one university — for the university detail page.
export async function dbGetAgreementsByUniversity(universityId: string) {
  return prisma.agreement.findMany({
    where: { universityId },
    include: {
      type: true,
      status: true,
      university: {
        select: {
          id: true,
          name: true, // Changed from 'nombre'
          slug: true,
          country: true, // Changed from 'pais'
          city: true, // Changed from 'ciudad'
        },
      },
      attrs: { include: { attr: true } },
      beneficiaries: { include: { beneficiary: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export type AgreementsByUniversityDTO = Awaited<
  ReturnType<typeof dbGetAgreementsByUniversity>
>[number];

export async function dbGetAgreementById(id: string) {
  const agreement = await prisma.agreement.findUnique({
    where: { id },
    include: {
      type: true,
      status: true,
      university: {
        select: {
          id: true,
          name: true, // Changed from 'nombre'
          slug: true,
          country: true, // Changed from 'pais'
          city: true, // Changed from 'ciudad'
        },
      },
      attrs: { include: { attr: true } },
      beneficiaries: { include: { beneficiary: true } },
    },
  });
  if (!agreement) throw new AgreementNotFoundError();

  return agreement;
}

export type AgreementDTO = Awaited<ReturnType<typeof dbGetAgreementById>>;

export function redactAgreements<T extends { link_convenio: string | null }>(
  agreements: T[],
  canReadSensitive: boolean
): T[] {
  if (canReadSensitive) return agreements;
  return agreements.map((a) => ({ ...a, link_convenio: null }));
}

export async function dbUpdateAgreement(id: string, data: AgreementInput) {
  // To handle junction updates cleanly, we delete existing connections and recreate them.
  await prisma.agreementAttr.deleteMany({ where: { agreementId: id } });
  await prisma.agreementBeneficiary.deleteMany({ where: { agreementId: id } });

  return prisma.agreement.update({
    where: { id },
    data: {
      typeId: data.typeId,
      statusId: data.statusId,
      spots: data.spots ?? null,
      link_convenio: data.link_convenio ?? null,
      attrs: {
        create: data.attrIds?.map((attrId) => ({ attrId })) || [],
      },
      beneficiaries: {
        create:
          data.beneficiaryIds?.map((beneficiaryId) => ({ beneficiaryId })) ||
          [],
      },
    },
  });
}

// TODO : Validate schema
export async function dbDeleteAgreement(id: string) {
  return prisma.agreement.delete({
    where: { id },
  });
}

/**
 * Fetches all active agreements with the full university shape needed for the
 * structured multi-sheet export. Intentionally separate from dbGetAgreements
 * to avoid bloating the table query with fields it doesn't render.
 */
export async function dbGetAgreementsForExport(universityId?: string) {
  return prisma.agreement.findMany({
    where: {
      deletedAt: null,
      university: { deletedAt: null },
      ...(universityId ? { universityId } : {}),
    },
    include: {
      type: true,
      university: {
        include: {
          campus: true,
          institutionType: true,
          region: true,
          country: true,
        },
      },
      beneficiaries: {
        include: { beneficiary: true },
      },
    },
    orderBy: [{ university: { name: 'asc' } }, { createdAt: 'desc' }],
  });
}

export type AgreementExportRow = Awaited<
  ReturnType<typeof dbGetAgreementsForExport>
>[number];

/**
 * Fetches all reference catalogs needed for the Catálogos sheet.
 * Run in parallel alongside the agreements query.
 */
export async function dbGetExportCatalogs() {
  const [regiones, paises, giros, tiposPlaza, beneficiarios] =
    await Promise.all([
      prisma.refRegion.findMany({ orderBy: { value: 'asc' } }),
      prisma.refCountry.findMany({ orderBy: { value: 'asc' } }),
      prisma.refInstitutionType.findMany({ orderBy: { value: 'asc' } }),
      prisma.refAgreementType.findMany({ orderBy: { value: 'asc' } }),
      prisma.refBeneficiary.findMany({ orderBy: { value: 'asc' } }),
    ]);

  return { regiones, paises, giros, tiposPlaza, beneficiarios };
}

export type ExportCatalogs = Awaited<ReturnType<typeof dbGetExportCatalogs>>;
