// lib/audit.ts
import 'server-only';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { Prisma } from '@/generated/prisma/client';

export type AuditAction = 'create' | 'update' | 'delete' | 'export';
export type AuditEntity =
  | 'university'
  | 'agreement'
  | 'user'
  | 'ref'
  | 'observation'
  | 'invite'
  | 'contact';

interface AuditParams {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}

export async function createAuditLog(params: AuditParams) {
  const hdrs = await headers();
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0].trim() ??
    hdrs.get('x-real-ip') ??
    null;

  // Fire-and-forget — never let audit logging block or fail a user action.
  prisma.auditLog
    .create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        before: params.before ?? undefined,
        after: params.after ?? undefined,
        ipAddress: ip,
      },
    })
    .catch((err) =>
      console.error('[audit] Failed to write audit log', { params, err })
    );
}
