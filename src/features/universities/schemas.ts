import { z } from 'zod';

const refId = z.number().int().min(0);

export const UNIVERSITY_FIELDS = {
  name: { required: true, label: 'Nombre' },
  start: { required: true, label: 'Inicio de la relación' },
  expires: { required: false, label: 'Expiración' },
  isCatholic: { required: true, label: 'Catolica' },
  webPage: { required: false, label: 'Pagina Web' },
  city: { required: false, label: 'Ciudad' },
  address: { required: false, label: 'Dirección' },
  regionId: { required: true, label: 'Región' },
  countryId: { required: true, label: 'País' },
  institutionTypeId: { required: true, label: 'Tipo de Institución' },
  campusId: { required: true, label: 'Campus' },
  utilizationId: { required: true, label: 'Utilización' },
};

export type UniversityFields = keyof typeof UNIVERSITY_FIELDS;

export const univeristySchema = z
  .object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(255)
      .trim(),

    // Empty string is valid (no website); if non-empty must be a valid URL
    start: z.date('La fecha de inicio es obligatoria'),
    expires: z.date().optional(),
    isCatholic: z.boolean(),

    webPage: z.url().optional(),

    regionId: refId,
    city: z.string().trim().max(150).optional(),
    countryId: refId,
    address: z.string().trim().max(500).optional(),

    institutionTypeId: refId,
    campusId: refId,
    utilizationId: refId,
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

export type UniversityInput = z.infer<typeof univeristySchema>;

export type UniversityUpdatePayload = Omit<
  UniversityInput,
  'expires' | 'webPage' | 'city' | 'address'
> & {
  expires: Date | null; // null = clear
  webPage: string | null; // null = clear
  city: string | null; // null = clear
  address: string | null; // null = clear
};
