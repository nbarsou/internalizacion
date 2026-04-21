'use server';

import { revalidatePath } from 'next/cache';
import slugify from 'slugify';
import { prisma } from '@/lib/prisma';
import { CreateUniversityInput, createUniversitySchema } from './schemas';
import { redirect } from 'next/navigation';

// ── Result type ───────────────────────────────────────────────────────────────

export type CreateUniversityResult =
  | { success: true; slug: string }
  | {
      success: false;
      fieldErrors: Partial<Record<string, string>>;
      formError?: string;
    };

// ── Slug generation ───────────────────────────────────────────────────────────

async function generateSlug(name: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true });
  const existing = await prisma.university.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  if (existing.length === 0) return base;
  const suffixes = existing.map((u) => {
    const m = u.slug.match(/-(\d+)$/);
    return m ? parseInt(m[1]) : 0;
  });
  return `${base}-${Math.max(...suffixes) + 1}`;
}

// ── FK validation ─────────────────────────────────────────────────────────────
// Returns a map of fieldName → error message for any ref ID that doesn't exist.

async function validateRefs(data: {
  regionId: number;
  countryId: number;
  institutionTypeId: number;
  campusId: number;
  utilizationId: number;
}): Promise<Partial<Record<string, string>>> {
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

  const errors: Partial<Record<string, string>> = {};
  if (!region) errors.regionId = 'La región seleccionada ya no existe';
  if (!country) errors.countryId = 'El país seleccionado ya no existe';
  if (!institutionType)
    errors.institutionTypeId = 'El tipo de institución ya no existe';
  if (!campus) errors.campusId = 'El campus seleccionado ya no existe';
  if (!utilization)
    errors.utilizationId = 'El nivel de utilización ya no existe';
  return errors;
}

// ── Action ────────────────────────────────────────────────────────────────────

export async function actionCreateUniversity(
  rawData: unknown
): Promise<CreateUniversityResult> {
  // 1. Zod validation
  const parsed = createUniversitySchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<string, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = (issue.path[0] as string) ?? '_form';
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, fieldErrors };
  }

  const data = parsed.data;

  // 2. FK reference validation
  const refErrors = await validateRefs(data);
  if (Object.keys(refErrors).length > 0) {
    return { success: false, fieldErrors: refErrors };
  }

  // 3. Create
  try {
    const slug = await generateSlug(data.name);

    const university = await prisma.university.create({
      data: {
        slug,
        name: data.name,
        start: new Date(data.start),
        expires: data.expires ? new Date(data.expires) : null,
        isCatholic: data.isCatholic,
        pagina_web: data.pagina_web || null,
        city: data.city || null,
        address: data.address || null,
        regionId: data.regionId,
        countryId: data.countryId,
        institutionTypeId: data.institutionTypeId,
        campusId: data.campusId,
        utilizationId: data.utilizationId,
      },
      select: { slug: true },
    });

    revalidatePath('/universities');
    return { success: true, slug: university.slug };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('Unique constraint')) {
      return {
        success: false,
        fieldErrors: {
          name: 'Ya existe una institución con un nombre muy similar',
        },
      };
    }
    return {
      success: false,
      fieldErrors: {},
      formError: 'Error al guardar. Intenta de nuevo.',
    };
  }
}

// ── Result type ───────────────────────────────────────────────────────────────

export type UpdateUniversityResult =
  | { success: true; slug: string }
  | {
      success: false;
      fieldErrors: Partial<Record<string, string>>;
      formError?: string;
    };

// ── Update ────────────────────────────────────────────────────────────────────

export async function actionUpdateUniversity(
  id: string,
  rawData: unknown
): Promise<UpdateUniversityResult> {
  // 1. Zod validation
  const parsed = createUniversitySchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<string, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = (issue.path[0] as string | undefined) ?? 'root';
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, fieldErrors };
  }

  const data = parsed.data as CreateUniversityInput;

  // 2. FK validation
  const refErrors = await validateRefs(data);
  if (Object.keys(refErrors).length > 0) {
    return { success: false, fieldErrors: refErrors };
  }

  // 3. Regenerate slug only if name changed
  try {
    const existing = await prisma.university.findUniqueOrThrow({
      where: { id },
      select: { name: true, slug: true },
    });

    let slug = existing.slug;
    if (existing.name !== data.name) {
      const base = slugify(data.name, { lower: true, strict: true });
      const others = await prisma.university.findMany({
        where: { slug: { startsWith: base }, NOT: { id } },
        select: { slug: true },
      });
      if (others.length === 0) {
        slug = base;
      } else {
        const max = Math.max(
          ...others.map((u) => {
            const m = u.slug.match(/-(\d+)$/);
            return m ? parseInt(m[1]) : 0;
          })
        );
        slug = `${base}-${max + 1}`;
      }
    }

    await prisma.university.update({
      where: { id },
      data: {
        slug,
        name: data.name,
        start: new Date(data.start),
        expires: data.expires ? new Date(data.expires) : null,
        isCatholic: data.isCatholic,
        pagina_web: data.pagina_web || null,
        city: data.city || null,
        address: data.address || null,
        regionId: data.regionId,
        countryId: data.countryId,
        institutionTypeId: data.institutionTypeId,
        campusId: data.campusId,
        utilizationId: data.utilizationId,
      },
    });

    revalidatePath('/universities');
    revalidatePath(`/universities/${slug}`);
    return { success: true, slug };
  } catch {
    return {
      success: false,
      fieldErrors: {},
      formError: 'Error al guardar. Intenta de nuevo.',
    };
  }
}

// ── Delete (soft) ─────────────────────────────────────────────────────────────

export async function actionDeleteUniversity(id: string): Promise<void> {
  await prisma.university.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath('/universities');
  redirect('/universities');
}
