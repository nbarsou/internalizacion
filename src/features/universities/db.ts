import 'server-only';

import { customAlphabet } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { UniversityInput } from './schemas';
import { toSlug } from '@/lib/slugify';
import { Prisma } from '@/generated/prisma/client';

const nanoidSlug = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 4);

// ── Custom error classes ──────────────────────────────────────────────────────

export class UniversityNotFoundError extends Error {}
export class DuplicateSlugError extends Error {}
export class InvalidReferenceError extends Error {}

// ── Validation ────────────────────────────────────────────────────────────────

export async function validateRefs(data: {
  regionId: number;
  countryId: number;
  institutionTypeId: number;
  campusId: number;
  utilizationId: number;
}): Promise<void> {
  const [region, country, institutionType, campus, utilization] =
    await Promise.all([
      prisma.refRegion.findUnique({
        where: { id: data.regionId },
        select: { id: true },
      }),
      prisma.refCountry.findUnique({
        where: { id: data.countryId },
        select: { id: true },
      }),
      prisma.refInstitutionType.findUnique({
        where: { id: data.institutionTypeId },
        select: { id: true },
      }),
      prisma.refCampus.findUnique({
        where: { id: data.campusId },
        select: { id: true },
      }),
      prisma.refUtilization.findUnique({
        where: { id: data.utilizationId },
        select: { id: true },
      }),
    ]);

  if (!region || !country || !institutionType || !campus || !utilization) {
    throw new InvalidReferenceError();
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function dbCreateUniversity(data: UniversityInput) {
  const baseSlug = toSlug(data.name);

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${nanoidSlug()}`;

    try {
      return await prisma.$transaction(async (tx) => {
        return tx.university.create({
          data: {
            slug,
            name: data.name,
            start: data.start,
            expires: data.expires,
            isCatholic: data.isCatholic,
            web_page: data.webPage,
            city: data.city,
            address: data.address,
            lat: data.lat ?? null,
            lng: data.lng ?? null,
            regionId: data.regionId,
            countryId: data.countryId,
            institutionTypeId: data.institutionTypeId,
            campusId: data.campusId,
            utilizationId: data.utilizationId,
          },
          select: { slug: true },
        });
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        continue;
      }
      throw e;
    }
  }
  console.error(`Could not generate a unique slug for: ${baseSlug}`);
  throw new Error(`Could not generate a unique slug for: ${baseSlug}`);
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function dbGetUniversities() {
  return prisma.university.findMany({
    where: { deletedAt: null },
    include: {
      region: true,
      country: true,
      institutionType: true,
      campus: true,
      utilization: true,
      contacts: true,
      observations: true,
      _count: { select: { agreements: true } },
      agreements: {
        where: { deletedAt: null },
        include: {
          type: true,
          status: true,
          observations: true,
          beneficiaries: { include: { beneficiary: true } },
          attrs: { include: { attr: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export type UniversitiesDTO = Awaited<
  ReturnType<typeof dbGetUniversities>
>[number];

export async function dbGetUniversityBySlug(slug: string) {
  const university = await prisma.university.findUnique({
    where: { slug },
    include: {
      region: true,
      country: true,
      institutionType: true,
      campus: true,
      utilization: true,
      _count: { select: { agreements: true } },
      contacts: { orderBy: { concernType: 'asc' } },
      agreements: {
        include: {
          type: true,
          status: true,
          attrs: { include: { attr: true } },
          beneficiaries: { include: { beneficiary: true } },
          observations: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      observations: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!university) throw new UniversityNotFoundError();
  return university;
}

export type UniversityDTO = Awaited<ReturnType<typeof dbGetUniversityBySlug>>;

// ── Update ────────────────────────────────────────────────────────────────────

export async function dbUpdateUniversity(slug: string, data: UniversityInput) {
  const result = await prisma.university.updateMany({
    where: { slug },
    data: {
      name: data.name,
      start: data.start,
      expires: data.expires,
      isCatholic: data.isCatholic,
      web_page: data.webPage,
      city: data.city,
      address: data.address,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      regionId: data.regionId,
      countryId: data.countryId,
      institutionTypeId: data.institutionTypeId,
      campusId: data.campusId,
      utilizationId: data.utilizationId,
    },
  });
  if (result.count === 0) throw new UniversityNotFoundError();
}

// ── Delete  ─────────────────────────────────────────────────────────────
export async function dbDeleteUniversity(id: string) {
  const result = await prisma.university.deleteMany({
    where: { id },
  });
  if (result.count === 0) throw new UniversityNotFoundError();
}
