/**
 * tanstack-table.d.ts
 *
 * Extends TanStack Table's ColumnMeta interface so `meta.exportValue` and
 * `meta.label` are typed project-wide without needing a cast at every call site.
 *
 * Place this file anywhere TypeScript picks it up (e.g. src/types/ or the
 * project root next to tsconfig.json). No imports needed — declaration merging
 * happens automatically.
 */

import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /**
     * Human-readable column header used in the Excel export.
     * Falls back to a title-cased version of the column id when absent.
     */
    label?: string;

    /**
     * Returns the plain-text / numeric value to write into the Excel cell.
     * Define this on any column whose `cell` renderer returns JSX (badges,
     * links, formatted dates) so the export gets a clean primitive instead
     * of "[object Object]".
     *
     * Columns whose `accessorFn` already returns a string or number do NOT
     * need this — the utility falls back to `row.getValue(col.id)` correctly.
     */
    exportValue?: (row: TData) => string | number | null | undefined;
  }
}
