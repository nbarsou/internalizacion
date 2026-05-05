// features/dashboard/utils.ts
import { type ChartConfig } from '@/components/ui/chart';

/**
 * Fallback palette used when a ref-table row has no color set.
 * Mirrors the CSS variables in order so the chart still looks intentional.
 */
export const FALLBACK_CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
] as const;

/**
 * Builds a shadcn ChartConfig object dynamically from query results.
 *
 * @param metaKey   - The key for the "value" series (e.g. "agreements", "count").
 * @param metaLabel - The human-readable label for that series (shown in tooltips).
 * @param items     - One entry per data row. `dataKey` must match the field used
 *                    as `nameKey` / `categoryKey` in the chart component.
 *
 * Colors are resolved in priority order:
 *   1. `color` from the ref table (set by admins in the seed/UI)
 *   2. CSS-variable fallback from FALLBACK_CHART_COLORS (cycles if > 5 items)
 *
 * The "Otros" bucket created by grouping queries always receives a neutral zinc
 * color from the query itself, so it doesn't consume a fallback slot.
 */
export function buildChartConfig(
  metaKey: string,
  metaLabel: string,
  items: { dataKey: string; label: string; color: string | null }[]
): ChartConfig {
  return {
    [metaKey]: { label: metaLabel },
    ...Object.fromEntries(
      items.map((item, i) => [
        item.dataKey,
        {
          label: item.label,
          color:
            item.color ??
            FALLBACK_CHART_COLORS[i % FALLBACK_CHART_COLORS.length],
        },
      ])
    ),
  };
}
