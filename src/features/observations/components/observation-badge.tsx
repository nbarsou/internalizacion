import { Badge } from '@/components/ui/badge';
import { ObservationLevel } from '@/generated/prisma/client';

interface ObservationBadgeProps {
  level: ObservationLevel;
}

const config: Record<ObservationLevel, { label: string; className: string }> = {
  ERROR: {
    label: 'Error',
    className: 'bg-red-100    text-red-700    border-red-200',
  },
  WARNING: {
    label: 'Aviso',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  INFO: {
    label: 'Info',
    className: 'bg-blue-100   text-blue-700   border-blue-200',
  },
};

export function ObservationBadge({ level }: ObservationBadgeProps) {
  const { label, className } = config[level];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
