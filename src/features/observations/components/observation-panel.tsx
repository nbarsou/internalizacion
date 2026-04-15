import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ObservationItem } from '@/features/observations/db';
import { ObservationList } from './observation-list';
import type { ObservationItemProps } from './observation-list';
import { ObservationLevel } from '@/generated/prisma/client';

interface ObservationPanelProps {
  observations: ObservationItem[];
  context?: ObservationItemProps['context'];
  title?: string;
  /**
   * Constrain list height when embedded alongside other cards.
   * Defaults to 320px — pass undefined for unbounded.
   */
  maxHeight?: string;
}

const LEVELS = [
  {
    level: ObservationLevel.ERROR,
    label: 'Errores',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  {
    level: ObservationLevel.WARNING,
    label: 'Avisos',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  {
    level: ObservationLevel.INFO,
    label: 'Info',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
] as const;

export function ObservationPanel({
  observations,
  context = 'global',
  title = 'Observaciones',
  maxHeight = '320px',
}: ObservationPanelProps) {
  const counts = LEVELS.map(({ level, label, className }) => ({
    label,
    className,
    count: observations.filter((o) => o.level === level).length,
  })).filter(({ count }) => count > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>

        {/* Level summary pills */}
        {counts.length > 0 && (
          <div className="flex items-center gap-1.5">
            {counts.map(({ label, className, count }) => (
              <Badge
                key={label}
                variant="outline"
                className={`${className} text-xs`}
              >
                {count} {label}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <ObservationList
          observations={observations}
          context={context}
          maxHeight={maxHeight}
        />
      </CardContent>
    </Card>
  );
}
