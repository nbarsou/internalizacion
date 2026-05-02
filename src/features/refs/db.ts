import 'server-only';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { RefTableName } from './schemas';

// ── Custom error classes ──────────────────────────────────────────────────────

export class RefDuplicateError extends Error {}
export class RefInUseError extends Error {}
export class RefNotFoundError extends Error {}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Wraps a Prisma call and converts known error codes into typed errors.
 * P2002 → unique constraint   → RefDuplicateError
 * P2003/P2014 → FK violation  → RefInUseError
 * P2025 → record not found    → RefNotFoundError
 */
export async function withRefErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') throw new RefDuplicateError();
      if (e.code === 'P2003' || e.code === 'P2014') throw new RefInUseError();
      if (e.code === 'P2025') throw new RefNotFoundError();
    }
    throw e;
  }
}

export async function dbGetUsedColors(
  table: RefTableName
): Promise<(string | null)[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await (prisma[table] as any).findMany({
    select: { color: true },
  });
  return rows.map((r: { color: string | null }) => r.color);
}

// Fetches in-use colors specifically for the beneficiary palette resolver
export async function dbGetBeneficiaryUsedColors(): Promise<(string | null)[]> {
  const records = await prisma.refBeneficiary.findMany({
    where: { color: { not: null } },
    select: { color: true },
  });
  return records.map((r) => r.color);
}

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

export async function dbUpdateBeneficiary(
  id: number,
  data: { cve?: string; value?: string; color?: string | null }
) {
  return prisma.refBeneficiary.update({
    where: { id },
    data,
  });
}

export async function dbCreateBeneficiary(data: {
  cve: string;
  value: string;
  color: string | null;
}) {
  return prisma.refBeneficiary.create({ data });
}

export async function dbDeleteBeneficiary(id: number) {
  return prisma.refBeneficiary.delete({
    where: { id },
  });
}
