import 'server-only';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { ObservationOrigin, ObservationLevel } from '@/generated/prisma/client';

// ── Shared include shape ──────────────────────────────────────────────────────

const observationInclude = {
  // If you ever want to show *where* an observation came from in a global feed:
  university: { select: { id: true, name: true } },
  agreement: { select: { id: true, type: true } },
} satisfies Prisma.ObservationInclude;

export type ObservationItem = Prisma.ObservationGetPayload<{
  include: typeof observationInclude;
}>;

// ── Read functions ────────────────────────────────────────────────────────────

// For a global system health / ETL report page
export async function dbGetAllObservations(level?: ObservationLevel) {
  return prisma.observation.findMany({
    where: level ? { level } : undefined,
    include: observationInclude,
    orderBy: { createdAt: 'desc' },
  });
}

// For the University Detail page
export async function dbGetObservationsByUniversity(universityId: string) {
  return prisma.observation.findMany({
    where: { universityId },
    include: observationInclude, // ← add this
    orderBy: { createdAt: 'desc' },
  });
}

// For the Agreement Detail page
export async function dbGetObservationsByAgreement(agreementId: string) {
  return prisma.observation.findMany({
    where: { agreementId },
    include: observationInclude, // ← add this
    orderBy: { createdAt: 'desc' },
  });
}
