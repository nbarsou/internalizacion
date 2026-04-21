import { z } from 'zod/v4';

export const agreementSchema = z.object({
  typeId: z.number({ error: 'Selecciona un tipo de convenio' }).int().min(1),
  statusId: z.number({ error: 'Selecciona un estado' }).int().min(1),
  spots: z.number().int().min(0).nullable().default(null),
  link_convenio: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => v === '' || /^https?:\/\/.+/.test(v),
      'Debe ser una URL válida'
    )
    .default(''),
  attrIds: z.array(z.number().int()).default([]),
  beneficiaryIds: z.array(z.number().int()).default([]),
});

export type AgreementFormValues = z.infer<typeof agreementSchema>;
