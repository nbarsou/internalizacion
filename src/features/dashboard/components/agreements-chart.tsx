// features/dashboard/components/agreements-chart.tsx
import { DonutChart } from '@/components/charts/donut-chart';
import { getAgreementStats } from '../queries';
import { buildChartConfig } from '../utils';

export async function AgreementsChart() {
  const data = await getAgreementStats();

  const config = buildChartConfig(
    'agreements',
    'Convenios',
    data.map((item) => ({
      dataKey: item.campus,
      label: item.campus,
      color: item.color,
    }))
  );

  return (
    <DonutChart
      title="Convenios por Campus"
      description="Distribución de convenios administrados"
      footer={{
        text: 'Total de convenios activos',
        trend: 'neutral',
      }}
      data={data}
      config={config}
      dataKey="agreements"
      nameKey="campus"
      centerLabel={{
        label: 'Convenios',
        valueKey: 'agreements',
      }}
    />
  );
}
