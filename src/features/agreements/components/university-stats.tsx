import { Card, CardContent } from '@/components/ui/card';
import type { AgreementItem } from '@/features/agreements/db';

interface UniversityStatsProps {
  agreements: AgreementItem[];
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function UniversityStats({ agreements }: UniversityStatsProps) {
  // Status is stored as a string value in RefStatus (e.g. "Activo", "N/A")
  const active = agreements.filter((a) => a.status?.value === 'Activo').length;
  const pending = agreements.filter(
    (a) => a.status?.value === 'En Negociación'
  ).length;
  const totalSpots = agreements.reduce((sum, a) => sum + (a.spots ?? 0), 0);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Total convenios" value={agreements.length} />
      <StatCard label="Activos" value={active} />
      <StatCard label="En negociación" value={pending} />
      <StatCard
        label="Plazas totales"
        value={totalSpots}
        sub="suma de todas las plazas"
      />
    </div>
  );
}
