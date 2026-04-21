import { z } from 'zod/v4';
import { prisma } from '@/lib/prisma';

// ── Shared field schemas ──────────────────────────────────────────────────────

const nameSchema = z.string().min(1).max(150).trim();
const valueSchema = z.string().min(1).max(150).trim();
const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color e.g. #22c55e')
  .optional()
  .or(z.literal(''));
const cveSchema = z.string().min(1).max(10).trim().toUpperCase();

// ── Strategy type ─────────────────────────────────────────────────────────────

export interface RefStrategy<TCreate extends z.ZodTypeAny> {
  /** Zod schema for the create payload */
  createSchema: TCreate;
  /** Execute the insert — id is always omitted, sequence handles it */
  create: (data: z.infer<TCreate>) => Promise<unknown>;
  /** Execute the name/value update */
  update: (id: number, data: z.infer<TCreate>) => Promise<unknown>;
  /** Execute the delete */
  delete: (id: number) => Promise<unknown>;
  /** Label shown in error messages */
  label: string;
}

// ── Individual strategies ─────────────────────────────────────────────────────

const nameCreateSchema = z.object({ name: nameSchema });
type NameCreate = z.infer<typeof nameCreateSchema>;

function makeNameStrategy(
  model: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (a: any) => Promise<unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (a: any) => Promise<unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete: (a: any) => Promise<unknown>;
  },
  label: string
): RefStrategy<typeof nameCreateSchema> {
  return {
    label,
    createSchema: nameCreateSchema,
    create: (data: NameCreate) => model.create({ data: { name: data.name } }),
    update: (id: number, data: NameCreate) =>
      model.update({ where: { id }, data: { name: data.name } }),
    delete: (id: number) => model.delete({ where: { id } }),
  };
}

const valueColorSchema = z.object({
  value: valueSchema,
  color: colorSchema,
});
type ValueColorCreate = z.infer<typeof valueColorSchema>;

function makeValueStrategy(
  model: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (a: any) => Promise<unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (a: any) => Promise<unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete: (a: any) => Promise<unknown>;
  },
  label: string
): RefStrategy<typeof valueColorSchema> {
  return {
    label,
    createSchema: valueColorSchema,
    create: (data: ValueColorCreate) =>
      model.create({
        data: {
          value: data.value,
          ...(data.color ? { color: data.color } : {}),
        },
      }),
    update: (id: number, data: ValueColorCreate) =>
      model.update({
        where: { id },
        data: {
          value: data.value,
          ...(data.color !== undefined ? { color: data.color || null } : {}),
        },
      }),
    delete: (id: number) => model.delete({ where: { id } }),
  };
}

const beneficiarySchema = z.object({
  cve: cveSchema,
  name: nameSchema,
});
type BeneficiaryCreate = z.infer<typeof beneficiarySchema>;

// ── Strategy registry ─────────────────────────────────────────────────────────

export const refStrategies = {
  refRegion: makeNameStrategy(prisma.refRegion, 'Región'),
  refCountry: makeNameStrategy(prisma.refCountry, 'País'),
  refInstitutionType: makeNameStrategy(
    prisma.refInstitutionType,
    'Tipo de institución'
  ),
  refCampus: makeNameStrategy(prisma.refCampus, 'Campus'),
  refAgreementType: makeNameStrategy(
    prisma.refAgreementType,
    'Tipo de convenio'
  ),
  refAttr: makeNameStrategy(prisma.refAttr, 'Acreditación'),
  refStatus: makeValueStrategy(prisma.refStatus, 'Estado'),
  refUtilization: makeValueStrategy(prisma.refUtilization, 'Utilización'),
  refBeneficiary: {
    label: 'Escuela beneficiaria',
    createSchema: beneficiarySchema,
    create: (data: BeneficiaryCreate) =>
      prisma.refBeneficiary.create({
        data: { cve: data.cve, name: data.name },
      }),
    update: (id: number, data: BeneficiaryCreate) =>
      prisma.refBeneficiary.update({
        where: { id },
        data: { cve: data.cve, name: data.name },
      }),
    delete: (id: number) => prisma.refBeneficiary.delete({ where: { id } }),
  } satisfies RefStrategy<typeof beneficiarySchema>,
} as const;

export type RefTableName = keyof typeof refStrategies;
