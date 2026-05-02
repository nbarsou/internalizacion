import { z } from 'zod';

const refId = z.number('Por favor elige un valor.').int().min(0);

export const AGREEMENT_FIELDS = {
  typeId: { required: true, label: 'Tipo de Convenio' },
  statusId: { required: true, label: 'Estado del Convenio' },
  spots: { required: false, label: 'Plazas' },
  link: { required: false, label: 'Link' },
  attrIds: { required: false, label: 'Attributos' },
  beneficiaryIds: { required: false, label: 'Beneficiarios' },
} as const;

export type AgreementFields = keyof typeof AGREEMENT_FIELDS;

export const agreementSchema = z.object({
  typeId: refId,
  statusId: refId,
  spots: z.number().int().min(0).optional(),
  link_convenio: z.url('Ingresa una URL valida.').optional(),
  attrIds: z.array(refId).optional(),
  beneficiaryIds: z.array(refId).optional(),
});

export type AgreementInput = z.infer<typeof agreementSchema>;
