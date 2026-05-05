// features/dashboard/components/expiring-chart.tsx
import { DonutChart } from '@/components/charts/donut-chart';
import { type ChartConfig } from '@/components/ui/chart';
import { getExpiringAgreements } from '../queries';

// Ranges are synthetic (computed in the query, not ref-table rows) so colors
// are intentionally hardcoded here. Do not migrate to buildChartConfig.
// Keys match the `range` field returned by getExpiringAgreements exactly.
const EXPIRY_CONFIG = {
  count: {
    label: 'Universidades',
  },
  expired: {
    label: 'Ya Vencidos',
    color: '#ef4444', // red-500    — requires action now
  },
  within_1y: {
    label: 'Vence en 1 Año',
    color: '#f97316', // orange-500 — watch closely
  },
  within_5y: {
    label: 'Vence en 5 Años',
    color: '#22c55e', // green-500  — healthy
  },
  indefinite: {
    label: 'Sin Fecha',
    color: '#71717a', // zinc-500   — no expiration set
  },
} satisfies ChartConfig;

export async function ExpiringAgreementsChart() {
  const data = await getExpiringAgreements();

  return (
    <DonutChart
      title="Estado de Vigencia"
      description="Universidades por estado de vencimiento de convenio marco"
      footer={{
        text: 'Universidades con convenio vencido o próximo a vencer',
        trend: 'down',
      }}
      data={data}
      config={EXPIRY_CONFIG}
      dataKey="count"
      nameKey="range"
      centerLabel={{
        label: 'Universidades',
        valueKey: 'count',
      }}
    />
  );
}
