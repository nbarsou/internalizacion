import { z } from 'zod';

export const OBSERVATION_FIELDS = {
  text: { required: true, label: 'Observación' },
};

export type ObservationFields = keyof typeof OBSERVATION_FIELDS;

export const observationSchema = z.object({
  text: z
    .string()
    .min(5, 'La observación debe tener al menos 5 caracteres')
    .max(500, 'La observacion no puede tener mas de 500 caracteres')
    .trim(),
});

export type ObservationInput = z.infer<typeof observationSchema>;
