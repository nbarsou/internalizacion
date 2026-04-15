import type { ObservationItem } from '@/features/observations/db';
import { ObservationRow } from './observation-row';
import type { ObservationItemProps } from './observation-row';

interface ObservationListProps {
  observations: ObservationItem[];
  context?: ObservationItemProps['context'];
  /**
   * Max height before the list becomes scrollable.
   * Useful when embedding inside a card with other content.
   * Pass undefined for no cap (global page).
   */
  maxHeight?: string;
}

export function ObservationList({
  observations,
  context = 'global',
  maxHeight,
}: ObservationListProps) {
  if (observations.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Sin observaciones.
      </p>
    );
  }

  return (
    <div
      className="divide-y overflow-y-auto"
      style={maxHeight ? { maxHeight } : undefined}
    >
      {observations.map((obs) => (
        <ObservationRow key={obs.id} observation={obs} context={context} />
      ))}
    </div>
  );
}

// Re-export so callers only need one import
export type { ObservationItemProps };
