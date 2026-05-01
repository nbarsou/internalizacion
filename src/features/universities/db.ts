import 'server-only';

import { customAlphabet } from 'nanoid';

import { prisma } from '@/lib/prisma';
import { UniversityInput, UniversityUpdatePayload } from './schemas';
import { toSlug } from '@/lib/slugify';
import { Prisma } from '@/generated/prisma/client';

const nanoidSlug = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 4);

export class UniversityNotFoundError extends Error {}
export class DuplicateSlugError extends Error {}
export class InvalidReferenceError extends Error {}

export async function dbGetUniversities() {
  return prisma.university.findMany({
    where: { deletedAt: null },
    include: {
      region: true,
      country: true,
      institutionType: true,
      campus: true,
      utilization: true,
      contacts: true, // ← was missing
      observations: true, // ← was missing
      _count: { select: { agreements: true } },
      agreements: {
        where: { deletedAt: null },
        include: {
          type: true,
          status: true, // ← was missing
          observations: true, // ← was missing
          beneficiaries: {
            // ← was missing
            include: { beneficiary: true },
          },
          attrs: {
            // ← was missing
            include: { attr: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

// keep UniversitiesDTO as the array form if anything else uses it
export type UniversitiesDTO = UniversityDTO[];

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

      contacts: {
        // Removed the `include` block here. Prisma fetches standard columns
        // (concernType, valueType, name, value) automatically.
        orderBy: { concernType: 'asc' },
      },

      agreements: {
        include: {
          type: true, // Assuming this is a relation
          status: true, // Assuming this is a relation
          attrs: { include: { attr: true } },
          beneficiaries: { include: { beneficiary: true } },
          observations: true,
        },
        orderBy: { createdAt: 'desc' },
      },

      observations: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!university) throw new UniversityNotFoundError();

  return university;
}

export type UniversityDTO = Awaited<ReturnType<typeof dbGetUniversityBySlug>>;

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

  // If any of the promises return null, someone likely tampered with the form payload
  if (!region || !country || !institutionType || !campus || !utilization) {
    throw new InvalidReferenceError();
  }
}

export async function dbCreateUniversity(data: UniversityInput) {
  const baseSlug = toSlug(data.name);

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${nanoidSlug()}`;

    try {
      return await prisma.$transaction(async (tx) => {
        const university = await tx.university.create({
          data: {
            slug,
            name: data.name,
            start: data.start,
            expires: data.expires,
            isCatholic: data.isCatholic,
            web_page: data.webPage,
            city: data.city,
            address: data.address,
            regionId: data.regionId,
            countryId: data.countryId,
            institutionTypeId: data.institutionTypeId,
            campusId: data.campusId,
            utilizationId: data.utilizationId,
          },
          select: { slug: true },
        });

        return university;
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        continue; // any P2002 from this transaction = slug collision, retry
      }
      throw e;
    }
  }
  // 5 failures = slug space exhausted for this name (36^4 = 1.6M per base)
  console.log(`Could not generate a unique slug for: ${baseSlug}`);
  throw new Error(`Could not generate a unique slug for: ${baseSlug}`);
}

export async function dbUpdateUniversity(
  slug: string,
  data: UniversityUpdatePayload
) {
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
      regionId: data.regionId,
      countryId: data.countryId,
      institutionTypeId: data.institutionTypeId,
      campusId: data.campusId,
      utilizationId: data.utilizationId,
    },
  });
  if (result.count === 0) throw new UniversityNotFoundError();
}
