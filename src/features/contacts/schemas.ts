import { z } from 'zod/v4';

const CONCERN_VALUES = ['INCOMING', 'OUTGOING', 'GENERAL'] as const;
const VALUE_TYPES = ['EMAIL', 'PHONE'] as const;

export const contactSchema = z
  .object({
    name: z.string().trim().max(150).default(''),
    concernType: z.enum(CONCERN_VALUES, { error: 'Selecciona un tipo' }),
    valueType: z.enum(VALUE_TYPES, { error: 'Selecciona un canal' }),
    value: z.string().trim().min(1, 'El valor es obligatorio').max(255),
  })
  .superRefine((data, ctx) => {
    if (data.valueType === 'EMAIL') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.value)) {
        ctx.addIssue({
          path: ['value'],
          code: 'custom',
          message: 'Email inválido',
        });
      }
    }
    if (data.valueType === 'PHONE') {
      if (!/^[\+\d][\d\s\-\.\(\)]{4,}$/.test(data.value)) {
        ctx.addIssue({
          path: ['value'],
          code: 'custom',
          message: 'Teléfono inválido',
        });
      }
    }
  });

export type ContactFormValues = z.infer<typeof contactSchema>;
