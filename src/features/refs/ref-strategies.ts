// src/features/refs/ref-strategies.ts
import 'server-only';
import { prisma } from '@/lib/prisma';
import { RefNotFoundError } from './db';
import type { RefTableName } from './schemas';

export interface RefStrategy {
  label: string;
  create: (data: { value: string; color: string }) => Promise<{ id: number }>;
  getById: (
    id: number
  ) => Promise<{ id: number; value: string; color: string | null }>;
  update: (
    id: number,
    data: { value?: string; color?: string }
  ) => Promise<unknown>;
  delete: (id: number) => Promise<unknown>;
}

function makeStrategy(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: { create: any; findUnique: any; update: any; delete: any },
  label: string
): RefStrategy {
  return {
    label,
    create: (data) =>
      model.create({ data: { value: data.value, color: data.color } }),
    getById: async (id) => {
      const result = await model.findUnique({ where: { id } });
      if (!result) throw new RefNotFoundError();
      return result;
    },
    update: (id, data) =>
      model.update({
        where: { id },
        data: {
          ...(data.value !== undefined ? { value: data.value } : {}),
          ...(data.color !== undefined ? { color: data.color } : {}),
        },
      }),
    delete: (id) => model.delete({ where: { id } }),
  };
}

export const refStrategies: Record<RefTableName, RefStrategy> = {
  refRegion: makeStrategy(prisma.refRegion, 'Región'),
  refCountry: makeStrategy(prisma.refCountry, 'País'),
  refInstitutionType: makeStrategy(
    prisma.refInstitutionType,
    'Tipo de institución'
  ),
  refCampus: makeStrategy(prisma.refCampus, 'Campus'),
  refAgreementType: makeStrategy(prisma.refAgreementType, 'Tipo de convenio'),
  refAttr: makeStrategy(prisma.refAttr, 'Acreditación'),
  refStatus: makeStrategy(prisma.refStatus, 'Estado'),
  refUtilization: makeStrategy(prisma.refUtilization, 'Utilización'),
};
