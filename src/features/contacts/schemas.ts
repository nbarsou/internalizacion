import { CONTACT_CONCERN_OPTIONS, CONTACT_VALUE_OPTIONS } from '@/lib/enums';
import { z } from 'zod/v4';

export const CONTACT_FIELDS = {
  name: { required: false, label: 'Nombre' },
  concernType: { required: true, label: 'Tipo' },
  valueType: { required: true, label: 'Canal' },
  value: { required: true, label: 'Valor' },
};

export type ContactFields = keyof typeof CONTACT_FIELDS;

export const contactSchema = z
  .object({
    name: z.string().trim().max(150).optional(),
    concernType: z.enum(CONTACT_CONCERN_OPTIONS, {
      error: 'Selecciona un tipo',
    }),
    valueType: z.enum(CONTACT_VALUE_OPTIONS, { error: 'Selecciona un canal' }),
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

export type ContactInput = z.infer<typeof contactSchema>;
