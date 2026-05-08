// src/features/refs/schemas.ts
// Client-safe — no Prisma imports.

import { z } from 'zod';

const valueSchema = z
  .string({ message: 'Ingresa un nombre' })
  .min(1, 'Ingresa un nombre')
  .max(150, 'Máximo 150 caracteres')
  .trim();

/**
 * Color: empty string OR valid hex.
 * Empty string is the "let the server pick" signal — never `undefined`,
 * since FormData entries are always strings.
 */
const colorSchema = z
  .string()
  .refine(
    (val) => val === '' || /^#[0-9a-fA-F]{6}$/.test(val),
    'Color hex inválido (ej. #22c55e)'
  )
  .optional();

export const refInputSchema = z.object({
  value: valueSchema,
  color: colorSchema,
});
export type RefInput = z.infer<typeof refInputSchema>;

export const REF_FIELDS = {
  value: { required: true, label: 'Nombre' },
  color: { required: false, label: 'Color' },
} as const;
export type RefFields = keyof typeof REF_FIELDS;

export type RefTableName =
  | 'refRegion'
  | 'refCountry'
  | 'refInstitutionType'
  | 'refCampus'
  | 'refAgreementType'
  | 'refAttr'
  | 'refStatus'
  | 'refUtilization';

// Maps each table to a specific integer offset
export const TABLE_COLOR_OFFSETS: Record<RefTableName, number> = {
  refRegion: 0,
  refCountry: 15,
  refInstitutionType: 30,
  refCampus: 45,
  refAgreementType: 60,
  refAttr: 75,
  refStatus: 90,
  refUtilization: 105,
};

export const beneficiaryInputSchema = z.object({
  cve: z
    .string({ message: 'Ingresa una clave (CVE)' })
    .min(1, 'Ingresa una clave')
    .max(2, 'Máximo dos caracteres')
    .trim()
    .toUpperCase(),
  value: valueSchema,
  color: colorSchema,
});

export type BeneficiaryInput = z.infer<typeof beneficiaryInputSchema>;

export const BENEFICIARY_FIELDS = {
  cve: { required: true, label: 'CVE' },
  value: { required: true, label: 'Nombre' },
  color: { required: false, label: 'Color' },
} as const;

export type BeneficiaryFields = keyof typeof BENEFICIARY_FIELDS;
