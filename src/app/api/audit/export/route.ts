import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/authn';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const bodySchema = z.object({
  entity: z.enum(['agreement', 'university']),
  count: z.number().int().min(0),
  filename: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const { userId } = await verifySession();

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return new NextResponse('Bad Request', { status: 400 });

  createAuditLog({
    userId,
    action: 'export',
    entity: parsed.data.entity,
    entityId: 'client-table', // distinguishes from the SUAS server export
    after: {
      count: parsed.data.count,
      filename: parsed.data.filename,
    },
  });

  return new NextResponse(null, { status: 204 });
}
