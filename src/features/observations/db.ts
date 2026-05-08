import 'server-only';

import { prisma } from '@/lib/prisma';
import { ObservationOrigin, ObservationLevel } from '@/generated/prisma/client';
import { ObservationInput } from './schemas';

// ── Custom error classes ──────────────────────────────────────────────────────

export class UniversityNotFoundError extends Error {}
export class ObservationNotFoundError extends Error {}

// ── Create ────────────────────────────────────────────────────────────────

export async function dbCreateObservation(
  slug: string,
  data: ObservationInput
) {
  const university = await prisma.university.findUnique({
    where: { slug },
  });

  if (!university) throw new UniversityNotFoundError();

  return await prisma.observation.create({
    data: {
      text: data.text,
      universityId: university.id,
      level: ObservationLevel.INFO,
      origin: ObservationOrigin.MANUAL,
    },
  });
}

// ── Read ────────────────────────────────────────────────────────────────

export async function dbGetObservationsByUniversity(universityId: string) {
  return prisma.observation.findMany({
    where: { universityId },
    include: {
      university: { select: { id: true, name: true } },
      agreement: { select: { id: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export type ObservationsDTO = Awaited<
  ReturnType<typeof dbGetObservationsByUniversity>
>[number];

export async function dbGetObservationById(id: string) {
  const result = await prisma.observation.findUnique({ where: { id } });
  if (!result) throw new ObservationNotFoundError();
  return result;
}

export type ObservationDTO = Awaited<ReturnType<typeof dbGetObservationById>>;

// ── Update ────────────────────────────────────────────────────────────────

export async function dbUpdateObservation(
  observationId: string,
  data: ObservationInput
) {
  const result = await prisma.observation.updateMany({
    where: { id: observationId },
    data: { text: data.text },
  });
  if (result.count === 0) throw new ObservationNotFoundError();
}

// ── Delete ────────────────────────────────────────────────────────────────

export async function dbDeleteObservation(observationId: string) {
  const result = await prisma.observation.deleteMany({
    where: { id: observationId },
  });

  if (result.count === 0) throw new ObservationNotFoundError();
}
