import 'server-only';

import { prisma } from '@/lib/prisma';
import { notDeleted } from '@/lib/db-filters';
import type { Prisma } from '@/generated/prisma/client';

export class UniversityNotFoundError extends Error {}
export class DuplicateSlugError extends Error {}

// ── Shared include shapes ─────────────────────────────────────────────────────

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
  // Lightweight — only the type name, used for the agreement-type facet filter
  agreements: {
    where: notDeleted,
    select: { type: { select: { name: true } } },
  },
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
