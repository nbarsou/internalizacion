/**
 * export-to-excel.ts
 *
 * Generic client-side Excel export for TanStack Table instances.
 * Exports ALL rows (unfiltered) using only the currently visible columns.
 *
 * Usage:
 *   import { exportTableToExcel } from '@/lib/export-to-excel';
 *   exportTableToExcel(table, 'instituciones');
 *
 * Column opt-in for custom display values:
 *   If a column's cell renders JSX (badges, links, formatted dates), add a
 *   `meta.exportValue` to its ColumnDef so the export gets a clean string:
 *
 *     meta: {
 *       exportValue: (row: MyDTO) => row.createdAt?.toLocaleDateString('es-MX') ?? '',
 *     }
 *
 *   Columns without `exportValue` fall back to `row.getValue(col.id)`, which
 *   works correctly for any column whose `accessorFn` already returns a
 *   primitive (string | number | null | undefined).
 */

import * as XLSX from 'xlsx';
import type { Table } from '@tanstack/react-table';

/**
 * Exports all rows of the table (ignoring active filters) to an .xlsx file
 * and triggers a browser download.
 *
 * @param table    - TanStack Table instance
 * @param filename - Output filename without extension
 * @param sheetName - Optional sheet tab name (defaults to filename)
 */
export function exportTableToExcel<TData>(
  table: Table<TData>,
  filename: string,
  sheetName?: string
): void {
  const visibleColumns = table.getVisibleLeafColumns();

  // ── Build header row ───────────────────────────────────────────────────────
  // Prefer meta.label, then the column id as a readable fallback.
  const headers: string[] = visibleColumns.map(
    (col) =>
      (col.columnDef.meta as { label?: string } | undefined)?.label ??
      col.id
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim()
  );

  // ── Build data rows ────────────────────────────────────────────────────────
  // getCoreRowModel() → all rows, unaffected by active column filters or
  // global search. This is intentional: the export is a full data dump.
  const rows = table.getCoreRowModel().rows.map((row) =>
    visibleColumns.map((col) => {
      // 1. Prefer explicit exportValue from column meta
      const exportValue = (
        col.columnDef.meta as
          | { exportValue?: (row: TData) => unknown }
          | undefined
      )?.exportValue;

      if (exportValue) return exportValue(row.original) ?? '';

      // 2. Fall back to the raw accessor value (works for string/number accessorFns)
      const raw = row.getValue(col.id);
      if (raw == null) return '';
      return raw;
    })
  );

  // ── Assemble workbook ──────────────────────────────────────────────────────
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Auto-size columns based on content (capped at 60 chars wide)
  const colWidths = headers.map((h, colIdx) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((r) => String(r[colIdx] ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 60) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    (sheetName ?? filename).slice(0, 31) // Excel sheet name limit
  );

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
