// features/dashboard/components/growth-chart.tsx
import { AreaChart } from '@/components/charts/area-chart';
import { type ChartConfig } from '@/components/ui/chart';
import { getGrowthStats } from '../queries';

// Growth series are synthetic (active vs pending), not ref-table rows,
// so the config stays static and uses CSS-variable theme colors.
const GROWTH_CONFIG = {
  active: {
    label: 'Activos',
    color: 'var(--color-chart-1)',
  },
  pending: {
    label: 'En Trámite',
    color: 'var(--color-chart-2)',
  },
} satisfies ChartConfig;

export async function GrowthChart() {
  const rawData = await getGrowthStats();

  // Truncate month label to first 3 chars ("ene", "feb"…) for axis readability.
  const data = rawData.map((item) => ({
    ...item,
    month: item.month.slice(0, 3),
  }));

  return (
    <AreaChart
      title="Crecimiento de Convenios"
      description="Comparativa: Activos vs. En Trámite (2024)"
      data={data}
      config={GROWTH_CONFIG}
      categoryKey="month"
      areas={[
        { dataKey: 'active', stackId: 'a', type: 'natural' },
        { dataKey: 'pending', stackId: 'a', type: 'natural' },
      ]}
    />
  );
}
