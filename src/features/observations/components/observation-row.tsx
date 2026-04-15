import type { ObservationItem } from '@/features/observations/db';
import { ObservationBadge } from './observation-badge';

export interface ObservationItemProps {
  observation: ObservationItem;
  /**
   * Controls whether to show the university/agreement context link.
   * - "university" → shows the agreement link if present
   * - "agreement"  → shows the university link if present
   * - "global"     → shows both
   * Default: "global"
   */
  context?: 'university' | 'agreement' | 'global';
}

export function ObservationRow({
  observation,
  context = 'global',
}: ObservationItemProps) {
  const { level, source, text, createdAt, university, agreement } = observation;

  const date = new Date(createdAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Level badge — fixed width keeps text aligned */}
      <div className="mt-0.5 w-16 shrink-0">
        <ObservationBadge level={level} />
      </div>

      <div className="min-w-0 flex-1">
        {/* Main text */}
        <p className="text-sm leading-snug">{text}</p>

        {/* Meta row: source + context + date */}
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
          {source && (
            <span className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px]">
              {source}
            </span>
          )}

          {/* University context — show on global and agreement views */}
          {context !== 'university' && university && (
            <span>{university.name}</span>
          )}

          {/* Agreement context — show on global and university views */}
          {context !== 'agreement' && agreement && (
            <span className="text-muted-foreground font-mono text-[10px]">
              convenio {agreement.id.slice(0, 8)}…
            </span>
          )}

          <span className="ml-auto">{date}</span>
        </div>
      </div>
    </div>
  );
}
