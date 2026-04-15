import 'server-only';

import { prisma } from '@/lib/prisma';
import { notDeleted } from '@/lib/db-filters';
import type { Prisma } from '@/generated/prisma/client';

// ── Custom error classes ──────────────────────────────────────────────────────

export class AgreementNotFoundError extends Error {}

// ── Shared include shape ──────────────────────────────────────────────────────

const agreementInclude = {
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
  beneficiaries: { include: { beneficiary: true } }, // Added from schema
} satisfies Prisma.AgreementInclude;

// ── Inferred return types ─────────────────────────────────────────────────────

export type AgreementItem = Prisma.AgreementGetPayload<{
  include: typeof agreementInclude;
}>;

// ── Read functions ────────────────────────────────────────────────────────────

// All agreements across all universities — for the global /agreements page.
export async function dbGetAgreements() {
  return prisma.agreement.findMany({
    where: notDeleted,
    include: agreementInclude,
    orderBy: { createdAt: 'desc' },
  });
}

// Agreements scoped to one university — for the university detail page.
export async function dbGetAgreementsByUniversity(universityId: string) {
  return prisma.agreement.findMany({
    where: { universityId, ...notDeleted },
    include: agreementInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function dbGetAgreementById(id: string) {
  return prisma.agreement.findFirst({
    where: { id, ...notDeleted },
    include: agreementInclude,
  });
}
