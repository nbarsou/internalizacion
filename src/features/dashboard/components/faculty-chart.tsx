// features/dashboard/components/faculty-chart.tsx
import { BarChart } from '@/components/charts/bar-chart';
import { getFacultyStats } from '../queries';
import { buildChartConfig } from '../utils';

// Maps the DB value to the short axis label shown on the bar chart.
// The color is carried through the transform so it isn't lost.
const SHORT_NAMES: Record<string, string> = {
  economy_business: 'Eco',
  engineering: 'Ing',
  health: 'Med',
  architecture_design: 'Arqui',
  law: 'Der',
};

export async function FacultyChart() {
  const rawData = await getFacultyStats();

  // Apply short-name transform server-side before building the config.
  const data = rawData.map((item) => ({
    ...item,
    faculty: SHORT_NAMES[item.faculty] ?? item.faculty,
  }));

  // dataKey = short name (e.g. "Eco") so it matches categoryKey="faculty".
  const config = buildChartConfig(
    'count',
    'Convenios',
    data.map((item) => ({
      dataKey: item.faculty,
      label: item.faculty,
      color: item.color,
    }))
  );

  return (
    <BarChart
      title="Convenios por Facultad"
      description="Top 5 áreas con mayor movilidad"
      data={data}
      config={config}
      dataKey="count"
      categoryKey="faculty"
    />
  );
}
