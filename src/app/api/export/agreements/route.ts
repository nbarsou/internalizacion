/**
 * app/api/export/agreements/route.ts
 *
 * GET /api/export/agreements
 * GET /api/export/agreements?universityId=<id>
 *
 * Protected: requires read:agreement permission.
 * The Link column in the Info sheet is only populated for users with
 * write:agreement (ADMIN and EDITOR roles).
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/authn';
import { hasPermission } from '@/lib/permissions';
import {
  dbGetAgreementsForExport,
  dbGetExportCatalogs,
} from '@/features/agreements/db';
import { buildAgreementsExportWorkbook } from '@/features/agreements/agreements-export-transform';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function GET(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const { role } = await verifySession();

  if (!hasPermission(role, 'write:agreement')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // ── Optional university scope ────────────────────────────────────────────────
  const universityId =
    req.nextUrl.searchParams.get('universityId') ?? undefined;

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const [agreements, catalogs] = await Promise.all([
    dbGetAgreementsForExport(universityId),
    dbGetExportCatalogs(),
  ]);

  // ── Transform ───────────────────────────────────────────────────────────────
  // buildAgreementsExportWorkbook returns a clean ArrayBuffer (via .slice()),
  // which Blob always accepts as BlobPart without type errors.
  const arrayBuffer = buildAgreementsExportWorkbook(agreements, catalogs);

  const blob = new Blob([arrayBuffer], { type: XLSX_MIME });

  // ── Stream ──────────────────────────────────────────────────────────────────
  const filename = `convenios_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': XLSX_MIME,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
