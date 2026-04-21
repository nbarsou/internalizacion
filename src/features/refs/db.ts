import 'server-only';
import { prisma } from '@/lib/prisma';

// ── Fetchers with usage counts ────────────────────────────────────────────────
// Each row includes a `_count` so the UI can show how many records reference
// this value and block deletion when count > 0.

export async function dbGetRegions() {
  return prisma.refRegion.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { universities: true } } },
  });
}

export async function dbGetCountries() {
  return prisma.refCountry.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { universities: true } } },
  });
}

export async function dbGetInstitutionTypes() {
  return prisma.refInstitutionType.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { universities: true } } },
  });
}

export async function dbGetCampuses() {
  return prisma.refCampus.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { universities: true } } },
  });
}

export async function dbGetAgreementTypes() {
  return prisma.refAgreementType.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { agreements: true } } },
  });
}

export async function dbGetAttrs() {
  return prisma.refAttr.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { agreementAttrs: true } } },
  });
}

export async function dbGetStatuses() {
  return prisma.refStatus.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { agreements: true } } },
  });
}

export async function dbGetUtilizations() {
  return prisma.refUtilization.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { universities: true } } },
  });
}

export async function dbGetBeneficiaries() {
  return prisma.refBeneficiary.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { agreements: true } } },
  });
}

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

export type AllRefs = Awaited<ReturnType<typeof dbGetAllRefs>>;

// ── Write functions ───────────────────────────────────────────────────────────

export type RefTableName =
  | 'refRegion'
  | 'refCountry'
  | 'refInstitutionType'
  | 'refCampus'
  | 'refAgreementType'
  | 'refAttr'
  | 'refStatus'
  | 'refUtilization'
  | 'refBeneficiary';

// Generic update — works for name-based tables (regions, countries, etc.)
export async function dbUpdateRefName(
  table: RefTableName,
  id: number,
  name: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma[table] as any).update({ where: { id }, data: { name } });
}

// Status and Utilization use `value` not `name`
export async function dbUpdateRefValue(
  table: 'refStatus' | 'refUtilization',
  id: number,
  value: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma[table] as any).update({ where: { id }, data: { value } });
}

export async function dbDeleteRef(table: RefTableName, id: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma[table] as any).delete({ where: { id } });
}

export async function dbCreateRef(
  table: RefTableName,
  data: { name?: string; value?: string; cve?: string; color?: string }
) {
  // Destructure to ensure id is never passed — ref tables use DB autoincrement
  const { name, value, cve, color } = data;
  const insertData = Object.fromEntries(
    Object.entries({ name, value, cve, color }).filter(
      ([, v]) => v !== undefined
    )
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma[table] as any).create({ data: insertData });
}
