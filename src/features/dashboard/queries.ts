// features/dashboard/queries.ts
import 'server-only';

import { prisma } from '@/lib/prisma';

// ── Agreements by Campus ──────────────────────────────────────────────────────

export interface AgreementData {
  campus: string;
  agreements: number;
  color: string | null; // ← from RefCampus.color
}

export async function getAgreementStats(): Promise<AgreementData[]> {
  const campuses = await prisma.refCampus.findMany({
    select: {
      value: true,
      color: true, // ← fetch ref-table color
      universities: {
        select: {
          _count: { select: { agreements: true } },
        },
      },
    },
  });

  return campuses
    .map((c) => ({
      campus: c.value,
      color: c.color,
      agreements: c.universities.reduce(
        (sum, u) => sum + u._count.agreements,
        0
      ),
    }))
    .filter((c) => c.agreements > 0)
    .sort((a, b) => b.agreements - a.agreements);
}

// ── Growth Over Time ──────────────────────────────────────────────────────────
// Growth is built from Agreement timestamps — no ref table, no color needed.

export interface GrowthData {
  month: string;
  active: number;
  pending: number;
}

export async function getGrowthStats(): Promise<GrowthData[]> {
  const agreements = await prisma.agreement.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = agreements.reduce(
    (acc, curr) => {
      const month = curr.createdAt.toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric',
      });
      if (!acc[month]) acc[month] = { active: 0, pending: 0 };
      acc[month].active += 1;
      return acc;
    },
    {} as Record<string, { active: number; pending: number }>
  );

  return Object.entries(grouped).map(([month, data]) => ({
    month,
    active: data.active,
    pending: data.pending,
  }));
}

// ── Agreements by Country ─────────────────────────────────────────────────────

// Capped at 8 for readability on a bar chart.
const MAX_COUNTRIES = 8;

export interface CountryData {
  country: string;
  agreements: number;
  color: string | null; // ← from RefCountry.color
}

export async function getCountryStats(): Promise<CountryData[]> {
  const countries = await prisma.refCountry.findMany({
    select: {
      value: true,
      color: true, // ← fetch ref-table color
      universities: {
        select: {
          _count: { select: { agreements: true } },
        },
      },
    },
  });

  return countries
    .map((c) => ({
      country: c.value,
      color: c.color,
      agreements: c.universities.reduce(
        (sum, u) => sum + u._count.agreements,
        0
      ),
    }))
    .filter((c) => c.agreements > 0)
    .sort((a, b) => b.agreements - a.agreements)
    .slice(0, MAX_COUNTRIES);
}

// ── Expiring Agreements ───────────────────────────────────────────────────────
// Ranges are synthetic (built here, not from a ref table) so there is no DB
// color to fetch. Colors are hardcoded in expiring-chart.tsx intentionally.
// Keys match what expiring-chart.tsx declares in its EXPIRY_CONFIG.

// Replaces getExpiringAgreements in features/dashboard/queries.ts

export interface ExpiryData {
  range: 'expired' | 'within_1y' | 'within_5y' | 'indefinite';
  count: number;
}

// Counts universities (not agreements) per expiry bucket.
// Expiration is modeled on University, not on Agreement, so this is the
// correct unit — one university, one expiry date.
export async function getExpiringAgreements(): Promise<ExpiryData[]> {
  const now = new Date();

  const addYears = (date: Date, years: number) => {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  };

  const oneYear = addYears(now, 1);
  const fiveYears = addYears(now, 5);

  // Shared base filter — never include soft-deleted universities.
  const active = { deletedAt: null } as const;

  const [expired, within1y, within5y, indefinite] = await Promise.all([
    // MOU already past its end date
    prisma.university.count({
      where: { ...active, expires: { lt: now } },
    }),
    // MOU ends within the next 12 months
    prisma.university.count({
      where: { ...active, expires: { gte: now, lte: oneYear } },
    }),
    // MOU ends between 1 and 5 years from now
    prisma.university.count({
      where: { ...active, expires: { gt: oneYear, lte: fiveYears } },
    }),
    // No end date set ("indefinido" in the source Excel)
    prisma.university.count({
      where: { ...active, expires: null },
    }),
  ]);

  return [
    { range: 'expired', count: expired },
    { range: 'within_1y', count: within1y },
    { range: 'within_5y', count: within5y },
    { range: 'indefinite', count: indefinite },
  ];
}

// ── Agreements by Type ────────────────────────────────────────────────────────
// Categories beyond MAX_TYPES are collapsed into a single "Otros" bucket so
// the donut chart stays readable. The "Otros" color is a neutral zinc hardcoded
// here since it isn't a real ref-table row.

const MAX_TYPES = 5;
const OTROS_COLOR = '#71717a'; // zinc-500

export interface AgreementTypeData {
  type: string;
  count: number;
  color: string | null;
}

export async function getAgreementTypeStats(): Promise<AgreementTypeData[]> {
  const types = await prisma.refAgreementType.findMany({
    select: {
      value: true,
      color: true, // ← fetch ref-table color
      _count: { select: { agreements: true } },
    },
  });

  const sorted = types
    .map((t) => ({
      type: t.value,
      color: t.color,
      count: t._count.agreements,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  // No grouping needed when we're already within the limit.
  if (sorted.length <= MAX_TYPES) return sorted;

  const top = sorted.slice(0, MAX_TYPES);
  const othersCount = sorted
    .slice(MAX_TYPES)
    .reduce((sum, t) => sum + t.count, 0);

  return [...top, { type: 'Otros', count: othersCount, color: OTROS_COLOR }];
}

// ── Top Faculties (Beneficiaries) ─────────────────────────────────────────────

export interface FacultyData {
  faculty: string;
  count: number;
  color: string | null; // ← from RefBeneficiary.color
}

export async function getFacultyStats(): Promise<FacultyData[]> {
  const beneficiaries = await prisma.refBeneficiary.findMany({
    select: {
      value: true,
      color: true, // ← fetch ref-table color
      _count: { select: { agreements: true } },
    },
  });

  return beneficiaries
    .map((b) => ({
      faculty: b.value,
      color: b.color,
      count: b._count.agreements,
    }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// ── Map Data (Universities with Coordinates) ──────────────────────────────────

export interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  coordinates: { lat: number; lng: number };
  agreements: number;
  activeSlots: number;
}

export async function getUniversities(): Promise<University[]> {
  const unis = await prisma.university.findMany({
    where: {
      lat: { not: null },
      lng: { not: null },
    },
    select: {
      id: true,
      name: true,
      city: true,
      lat: true,
      lng: true,
      country: true,
      _count: { select: { agreements: true } },
    },
  });

  return unis.map((u) => ({
    id: u.id,
    name: u.name,
    country: u.country.value,
    city: u.city || 'Unknown',
    coordinates: { lat: u.lat!, lng: u.lng! },
    agreements: u._count.agreements,
    activeSlots: 0,
  }));
}
