// features/dashboard/components/country-chart.tsx
import { BarChart } from '@/components/charts/bar-chart';
import { getCountryStats } from '../queries';
import { buildChartConfig } from '../utils';

export async function CountryChart() {
  const data = await getCountryStats();

  // Query already slices to top 8 for readability.
  const config = buildChartConfig(
    'agreements',
    'Convenios',
    data.map((item) => ({
      dataKey: item.country,
      label: item.country,
      color: item.color,
    }))
  );

  return (
    <BarChart
      title="Top Destinos Internacionales"
      description="Países con mayor número de acuerdos firmados"
      data={data}
      config={config}
      dataKey="agreements"
      categoryKey="country"
    />
  );
}
