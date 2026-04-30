import { z } from 'zod/v4';
import { ROLE_OPTIONS } from '@/lib/enums';

export const INVITE_FIELDS = {
  email: { required: true, label: 'Correo Electrónico' },
  role: { required: true, label: 'Rol de Usuario' },
  expiresAt: { required: false, label: 'Expiración de Accesso' },
} as const;

export type InviteFields = keyof typeof INVITE_FIELDS;

export const inviteSchema = z
  .object({
    email: z.email('Ingresa un correo electrónico válido').max(254),
    role: z.enum(ROLE_OPTIONS, 'Selecciona un rol válido'),
    expiresAt: z.date().optional(),
  })
  .refine((data) => {
    if (data.expiresAt) {
      return new Date() < data.expiresAt;
    }
    return true;
  });

export type InviteInput = z.infer<typeof inviteSchema>;
