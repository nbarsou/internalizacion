// features/dashboard/queries.ts
import 'server-only';

import { prisma } from '@/lib/prisma';
import { notDeleted } from '@/lib/db-filters';

// ── Agreements by Campus ──────────────────────────────────────────────────────

export interface AgreementData {
  campus: string;
  agreements: number;
}

export async function getAgreementStats(): Promise<AgreementData[]> {
  const campuses = await prisma.refCampus.findMany({
    select: {
      name: true,
      universities: {
        where: notDeleted,
        select: {
          _count: { select: { agreements: { where: notDeleted } } },
        },
      },
    },
  });

  return campuses
    .map((c) => ({
      campus: c.name,
      agreements: c.universities.reduce(
        (sum, u) => sum + u._count.agreements,
        0
      ),
    }))
    .filter((c) => c.agreements > 0)
    .sort((a, b) => b.agreements - a.agreements);
}

// ── Growth Over Time ──────────────────────────────────────────────────────────

export interface GrowthData {
  month: string;
  active: number;
  pending: number;
}

export async function getGrowthStats(): Promise<GrowthData[]> {
  const agreements = await prisma.agreement.findMany({
    where: notDeleted,
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by month (e.g., "Jan 2024")
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
    pending: data.pending, // If you have a real 'pending' status, you can filter by it above
  }));
}

// ── Agreements by Country ─────────────────────────────────────────────────────

export interface CountryData {
  country: string;
  agreements: number;
}

export async function getCountryStats(): Promise<CountryData[]> {
  const countries = await prisma.refCountry.findMany({
    select: {
      name: true,
      universities: {
        where: notDeleted,
        select: {
          _count: { select: { agreements: { where: notDeleted } } },
        },
      },
    },
  });

  return countries
    .map((c) => ({
      country: c.name,
      agreements: c.universities.reduce(
        (sum, u) => sum + u._count.agreements,
        0
      ),
    }))
    .filter((c) => c.agreements > 0)
    .sort((a, b) => b.agreements - a.agreements)
    .slice(0, 10); // Top 10 countries
}

// ── Expiring Agreements ───────────────────────────────────────────────────────

export interface ExpiryData {
  range: string;
  count: number;
}

export async function getExpiringAgreements(): Promise<ExpiryData[]> {
  const now = new Date();
  const addMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const sixMonths = addMonths(now, 6);
  const eightMonths = addMonths(now, 8);
  const year = addMonths(now, 12);

  const [one, three, six] = await Promise.all([
    prisma.agreement.count({
      where: {
        ...notDeleted,
        // Check the expiration date on the parent University
        university: {
          ...notDeleted,
          expires: { gte: now, lte: sixMonths },
        },
      },
    }),
    prisma.agreement.count({
      where: {
        ...notDeleted,
        university: {
          ...notDeleted,
          expires: { gt: sixMonths, lte: eightMonths },
        },
      },
    }),
    prisma.agreement.count({
      where: {
        ...notDeleted,
        university: {
          ...notDeleted,
          expires: { gt: eightMonths, lte: year },
        },
      },
    }),
  ]);

  return [
    { range: '6_month', count: one },
    { range: '8_months', count: three },
    { range: '12_months', count: six },
  ];
}

// ── Agreements by Type ────────────────────────────────────────────────────────

export interface AgreementTypeData {
  type: string;
  count: number;
}

export async function getAgreementTypeStats(): Promise<AgreementTypeData[]> {
  const types = await prisma.refAgreementType.findMany({
    select: {
      name: true,
      _count: { select: { agreements: { where: notDeleted } } },
    },
  });

  return types
    .map((t) => ({
      type: t.name,
      count: t._count.agreements,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
}

// ── Top Faculties (Beneficiaries) ─────────────────────────────────────────────

export interface FacultyData {
  faculty: string;
  count: number;
}

export async function getFacultyStats(): Promise<FacultyData[]> {
  const beneficiaries = await prisma.refBeneficiary.findMany({
    select: {
      name: true,
      _count: { select: { agreements: true } },
    },
  });

  return beneficiaries
    .map((b) => ({
      faculty: b.name,
      count: b._count.agreements,
    }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5
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
      ...notDeleted,
      lat: { not: null },
      lng: { not: null },
    },
    select: {
      id: true,
      name: true,
      city: true,
      lat: true,
      lng: true,
      country: { select: { name: true } },
      _count: { select: { agreements: { where: notDeleted } } },
    },
  });

  return unis.map((u) => ({
    id: u.id,
    name: u.name,
    country: u.country?.name || 'Unknown',
    city: u.city || 'Unknown',
    coordinates: { lat: u.lat!, lng: u.lng! },
    agreements: u._count.agreements,
    activeSlots: 0, // Fallback; you can query RefAttr to extract actual slots if needed later
  }));
}
