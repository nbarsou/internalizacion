import 'server-only';

import { prisma } from '@/lib/prisma';
import { notDeleted } from '@/lib/db-filters';
import type { Prisma } from '@/generated/prisma/client';

// ── Custom error classes ──────────────────────────────────────────────────────

export class UniversityNotFoundError extends Error {}
export class DuplicateSlugError extends Error {}

// ── Shared include shape ──────────────────────────────────────────────────────
// Define once, reuse in every read so the return types stay consistent.

const universityInclude = {
  region: true,
  country: true,
  institutionType: true,
  campus: true,
  utilization: true,
} satisfies Prisma.UniversityInclude;

const universityListInclude = {
  ...universityInclude,
  _count: { select: { agreements: { where: notDeleted } } },
} satisfies Prisma.UniversityInclude;

const universityDetailInclude = {
  ...universityInclude,
  contacts: {
    where: notDeleted,
    orderBy: { concernType: 'asc' },
  },
  agreements: {
    where: notDeleted,
    include: {
      type: true,
      status: true,
      attrs: { include: { attr: true } },
      beneficiaries: { include: { beneficiary: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
  observations: {
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.UniversityInclude;

// ── Inferred return types ─────────────────────────────────────────────────────
// Import these wherever you need to type a university prop.

export type UniversityListItem = Prisma.UniversityGetPayload<{
  include: typeof universityListInclude;
}>;

export type UniversityDetail = Prisma.UniversityGetPayload<{
  include: typeof universityDetailInclude;
}>;

// ── Read functions ────────────────────────────────────────────────────────────

export async function dbGetUniversities() {
  return prisma.university.findMany({
    where: notDeleted,
    include: universityListInclude,
    orderBy: { name: 'asc' },
  });
}

export async function dbGetUniversityBySlug(slug: string) {
  return prisma.university.findFirst({
    where: { slug, ...notDeleted },
    include: universityDetailInclude,
  });
}

export async function dbGetUniversityById(id: string) {
  return prisma.university.findFirst({
    where: { id, ...notDeleted },
    include: universityDetailInclude,
  });
}
