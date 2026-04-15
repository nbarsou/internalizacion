import 'server-only';

import { prisma } from '@/lib/prisma';

// ── Individual ref fetchers ───────────────────────────────────────────────────
// Each one is exported so a page can fetch only what it needs,
// but the combined getAllRefs() is the common case for forms.

export async function dbGetRegions() {
  return prisma.refRegion.findMany({ orderBy: { name: 'asc' } });
}

export async function dbGetCountries() {
  return prisma.refCountry.findMany({ orderBy: { name: 'asc' } });
}

export async function dbGetInstitutionTypes() {
  return prisma.refInstitutionType.findMany({ orderBy: { name: 'asc' } });
}

export async function dbGetCampuses() {
  return prisma.refCampus.findMany({ orderBy: { name: 'asc' } });
}

export async function dbGetAgreementTypes() {
  return prisma.refAgreementType.findMany({ orderBy: { name: 'asc' } });
}

export async function dbGetAttrs() {
  return prisma.refAttr.findMany({ orderBy: { name: 'asc' } });
}

export async function dbGetStatuses() {
  return prisma.refStatus.findMany({ orderBy: { value: 'asc' } });
}

export async function dbGetUtilizations() {
  return prisma.refUtilization.findMany({ orderBy: { value: 'asc' } });
}

export async function dbGetBeneficiaries() {
  return prisma.refBeneficiary.findMany({ orderBy: { name: 'asc' } });
}

// ── Combined fetcher ──────────────────────────────────────────────────────────
// Fetches every ref table in parallel. Pass the result to form components
// as props so they can populate their dropdowns without individual fetches.
//
// Usage in a page:
//   const refs = await dbGetAllRefs();
//   return <UniversityForm refs={refs} />;

export async function dbGetAllRefs() {
  const [
    regions,
    countries,
    institutionTypes,
    campuses,
    agreementTypes,
    attrs,
    statuses,
    utilizations,
    beneficiaries,
  ] = await Promise.all([
    dbGetRegions(),
    dbGetCountries(),
    dbGetInstitutionTypes(),
    dbGetCampuses(),
    dbGetAgreementTypes(),
    dbGetAttrs(),
    dbGetStatuses(),
    dbGetUtilizations(),
    dbGetBeneficiaries(),
  ]);

  return {
    regions,
    countries,
    institutionTypes,
    campuses,
    agreementTypes,
    attrs,
    statuses,
    utilizations,
    beneficiaries,
  };
}

// ── Typed return type ─────────────────────────────────────────────────────────
// Inferred from the combined fetcher — import this wherever you need to type
// a `refs` prop without duplicating the shape manually.
//
// Usage:
//   import type { AllRefs } from '@/features/refs/db';
//   interface Props { refs: AllRefs }

export type AllRefs = Awaited<ReturnType<typeof dbGetAllRefs>>;

// ── Ref validation helper ─────────────────────────────────────────────────────
// Used in actions to verify a ref ID actually exists in the DB before writing.
// Returns true if the ID is valid, false otherwise.
// All checks run in parallel — one round-trip regardless of how many refs.
//
// Usage in an action:
//   const valid = await dbValidateRefs({ regionId: 3, countryId: 7 });
//   if (!valid) return { success: false, message: 'Valor de referencia inválido.' };

type RefValidationInput = {
  regionId?: number;
  countryId?: number;
  institutionTypeId?: number;
  campusId?: number;
  utilizationId?: number;
  typeId?: number;
  statusId?: number;
};

export async function dbValidateRefs(
  refs: RefValidationInput
): Promise<boolean> {
  const checks: Promise<unknown>[] = [];

  if (refs.regionId !== undefined) {
    checks.push(
      prisma.refRegion.findUnique({
        where: { id: refs.regionId },
        select: { id: true },
      })
    );
  }
  if (refs.countryId !== undefined) {
    checks.push(
      prisma.refCountry.findUnique({
        where: { id: refs.countryId },
        select: { id: true },
      })
    );
  }
  if (refs.institutionTypeId !== undefined) {
    checks.push(
      prisma.refInstitutionType.findUnique({
        where: { id: refs.institutionTypeId },
        select: { id: true },
      })
    );
  }
  if (refs.campusId !== undefined) {
    checks.push(
      prisma.refCampus.findUnique({
        where: { id: refs.campusId },
        select: { id: true },
      })
    );
  }
  if (refs.utilizationId !== undefined) {
    checks.push(
      prisma.refUtilization.findUnique({
        where: { id: refs.utilizationId },
        select: { id: true },
      })
    );
  }
  if (refs.typeId !== undefined) {
    checks.push(
      prisma.refAgreementType.findUnique({
        where: { id: refs.typeId },
        select: { id: true },
      })
    );
  }
  if (refs.statusId !== undefined) {
    checks.push(
      prisma.refStatus.findUnique({
        where: { id: refs.statusId },
        select: { id: true },
      })
    );
  }

  const results = await Promise.all(checks);
  // If any result is null, it means that specific ID was not found in the DB.
  return results.every((r) => r !== null);
}
