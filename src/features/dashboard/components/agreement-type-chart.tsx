// features/dashboard/components/agreement-type-chart.tsx
import { DonutChart } from '@/components/charts/donut-chart';
import { getAgreementTypeStats } from '../queries';
import { buildChartConfig } from '../utils';

export async function AgreementTypeChart() {
  const data = await getAgreementTypeStats();

  // The query already groups anything beyond the top 5 into an "Otros" bucket
  // with a neutral zinc color, so no extra handling is needed here.
  const config = buildChartConfig(
    'count',
    'Total',
    data.map((item) => ({
      dataKey: item.type,
      label: item.type,
      color: item.color,
    }))
  );

  return (
    <DonutChart
      title="Tipos de Convenio"
      description="Distribución por modalidad educativa"
      footer={{
        text: 'Modalidades activas',
        trend: 'neutral',
      }}
      data={data}
      config={config}
      dataKey="count"
      nameKey="type"
      centerLabel={{
        label: 'Convenios',
        valueKey: 'count',
      }}
    />
  );
}
