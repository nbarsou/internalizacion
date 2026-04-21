import { z } from 'zod/v4';

// ── Helpers ───────────────────────────────────────────────────────────────────

const refId = (label: string) =>
  z
    .number({ error: `Selecciona un valor para ${label}` })
    .int()
    .min(0);

// ── Schema ────────────────────────────────────────────────────────────────────
// Rule: every field must resolve to a concrete type (no `| undefined`) so that
// react-hook-form's generic resolves cleanly against CreateUniversityInput.
// Use .default('') instead of .optional() for optional string fields.

export const createUniversitySchema = z
  .object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(255)
      .trim(),

    // Empty string is valid (no website); if non-empty must be a valid URL
    pagina_web: z
      .string()
      .trim()
      .max(500)
      .refine(
        (v) => v === '' || /^https?:\/\/.+/.test(v),
        'Debe ser una URL válida (incluye https://)'
      )
      .default(''),

    start: z
      .string()
      .min(1, 'La fecha de inicio es obligatoria')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),

    // Empty string means indefinido — validated only when non-empty
    expires: z
      .string()
      .refine(
        (v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v),
        'Formato de fecha inválido'
      )
      .default(''),

    isCatholic: z.boolean().default(false),

    city: z.string().trim().max(150).default(''),
    address: z.string().trim().max(500).default(''),

    regionId: refId('región'),
    countryId: refId('país'),
    institutionTypeId: refId('tipo de institución'),
    campusId: refId('campus'),
    utilizationId: refId('utilización'),
  })
  .superRefine((data, ctx) => {
    if (data.expires && data.start && data.expires < data.start) {
      ctx.addIssue({
        path: ['expires'],
        code: 'custom',
        message: 'La vigencia no puede ser anterior a la fecha de inicio',
      });
    }
  });

export type CreateUniversityInput = z.infer<typeof createUniversitySchema>;
