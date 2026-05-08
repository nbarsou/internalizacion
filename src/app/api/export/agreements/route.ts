import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/authn';
import { hasPermission } from '@/lib/permissions';
import {
  dbGetAgreementsForExport,
  dbGetExportCatalogs,
} from '@/features/agreements/db';
import { buildAgreementsExportWorkbook } from '@/features/agreements/agreements-export-transform';
import { createAuditLog } from '@/lib/audit';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { role, userId } = await verifySession();

  if (!hasPermission(role, 'write:agreement'))
    return new NextResponse('Forbidden', { status: 403 });

  // ── Optional university scope ─────────────────────────────────────────────
  const universityId =
    req.nextUrl.searchParams.get('universityId') ?? undefined;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const [agreements, catalogs] = await Promise.all([
    dbGetAgreementsForExport(universityId),
    dbGetExportCatalogs(),
  ]);

  // ── Transform ─────────────────────────────────────────────────────────────
  const arrayBuffer = buildAgreementsExportWorkbook(agreements, catalogs);

  // ── Audit ─────────────────────────────────────────────────────────────────
  // Fire-and-forget — never block the file download on a log write.
  createAuditLog({
    userId,
    action: 'export',
    entity: 'agreement',
    entityId: universityId ?? 'bulk', // 'bulk' when no scope filter was applied
    after: {
      count: agreements.length,
      scope: universityId ? 'university' : 'all',
    },
  });

  // ── Stream ────────────────────────────────────────────────────────────────
  const filename = `convenios_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Blob([arrayBuffer], { type: XLSX_MIME }), {
    status: 200,
    headers: {
      'Content-Type': XLSX_MIME,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
