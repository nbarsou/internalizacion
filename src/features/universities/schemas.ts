import { z } from 'zod';

const refId = z.number('Por favor elige un valor.').int().min(0);

export const UNIVERSITY_FIELDS = {
  name: { required: true, label: 'Nombre' },
  start: { required: true, label: 'Inicio de la relación' },
  expires: { required: false, label: 'Expiración' },
  isCatholic: { required: true, label: 'Católica' },
  webPage: { required: false, label: 'Página Web' },
  city: { required: false, label: 'Ciudad' },
  address: { required: false, label: 'Dirección' },
  lat: { required: false, label: 'Latitud' },
  lng: { required: false, label: 'Longitud' },
  regionId: { required: true, label: 'Región' },
  countryId: { required: true, label: 'País' },
  institutionTypeId: { required: true, label: 'Tipo de Institución' },
  campusId: { required: true, label: 'Campus' },
  utilizationId: { required: true, label: 'Utilización' },
} as const;

export type UniversityFields = keyof typeof UNIVERSITY_FIELDS;

export const univeristySchema = z
  .object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(255)
      .trim(),
    start: z.date('La fecha de inicio es obligatoria'),
    expires: z.date().optional(),
    isCatholic: z.boolean(),
    webPage: z.url('Ingresa una URL válida.').optional(),

    regionId: refId,
    countryId: refId,
    city: z.string().trim().max(150).optional(),
    address: z.string().trim().max(500).optional(),

    // WGS-84 decimal degrees — both or neither
    lat: z
      .number()
      .min(-90, 'Latitud debe estar entre -90 y 90')
      .max(90, 'Latitud debe estar entre -90 y 90')
      .optional(),
    lng: z
      .number()
      .min(-180, 'Longitud debe estar entre -180 y 180')
      .max(180, 'Longitud debe estar entre -180 y 180')
      .optional(),

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

    // lat and lng must be set together
    const hasLat = data.lat !== undefined;
    const hasLng = data.lng !== undefined;
    if (hasLat && !hasLng) {
      ctx.addIssue({
        path: ['lng'],
        code: 'custom',
        message: 'Ingresa la longitud junto con la latitud',
      });
    }
    if (hasLng && !hasLat) {
      ctx.addIssue({
        path: ['lat'],
        code: 'custom',
        message: 'Ingresa la latitud junto con la longitud',
      });
    }
  });

export type UniversityInput = z.infer<typeof univeristySchema>;
