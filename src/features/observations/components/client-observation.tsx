'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ObservationLevel, ObservationOrigin } from '@/generated/prisma/client';
import { CreateObservationModal } from './create-observation-modal';
import { EditObservationModal } from './edit-observation-modal';
import { DeleteObservationModal } from './delete-observation-modal';
import { ObservationDTO } from '../db';

// ─── Modal state ────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; item: ObservationDTO }
  | { type: 'delete'; item: ObservationDTO };

// ─── Level badge ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<
  ObservationLevel,
  { label: string; className: string }
> = {
  ERROR: {
    label: 'Error',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  WARNING: {
    label: 'Aviso',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  INFO: {
    label: 'Info',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
};

// ─── Origin label ─────────────────────────────────────────────────────────────

const ORIGIN_LABEL: Record<ObservationOrigin, string> = {
  MANUAL: 'Manual',
  GENERATED: 'Sistema',
};

// ─── Context prop ─────────────────────────────────────────────────────────────

/**
 * Controls which context columns are visible.
 * - "university" → agreement column only (university is implicit from the page)
 * - "agreement"  → university column only
 * - "global"     → both
 */
type ObservationContext = 'university' | 'agreement' | 'global';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ObservationClientProps {
  slug: string;
  observations: ObservationDTO[];
  context?: ObservationContext;
  canWrite: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ObservationClient({
  slug,
  observations,
  context = 'global',
  canWrite,
}: ObservationClientProps) {
  const [modal, setModal] = useState<ModalState>({ type: 'closed' });
  const close = () => setModal({ type: 'closed' });

  const showUniversity = context !== 'university';

  return (
    <div className="space-y-4">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Observaciones</h2>
          <p className="text-muted-foreground text-sm">
            {observations.length}{' '}
            {observations.length === 1 ? 'observación' : 'observaciones'}
          </p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => setModal({ type: 'create' })}>
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Nueva Observación
          </Button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {observations.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          Sin observaciones. Crea la primera con el botón de arriba.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Nivel</TableHead>
                <TableHead>Observación</TableHead>
                {showUniversity && (
                  <TableHead className="hidden w-40 md:table-cell">
                    Universidad
                  </TableHead>
                )}

                <TableHead className="hidden w-28 sm:table-cell">
                  Origen
                </TableHead>
                <TableHead className="w-32">Fecha</TableHead>
                {canWrite && (
                  <TableHead className="w-20 text-right">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {observations.map((obs) => {
                const { label, className } = LEVEL_CONFIG[obs.level];

                const date = new Date(obs.createdAt).toLocaleDateString(
                  'es-MX',
                  { year: 'numeric', month: 'short', day: 'numeric' }
                );

                return (
                  <TableRow key={obs.id}>
                    {/* Level */}
                    <TableCell>
                      <Badge variant="outline" className={className}>
                        {label}
                      </Badge>
                    </TableCell>

                    {/* Text — truncated, full text on title for hover */}
                    <TableCell className="max-w-xs truncate" title={obs.text}>
                      {obs.text}
                    </TableCell>

                    {/* University */}
                    {showUniversity && (
                      <TableCell className="text-muted-foreground hidden truncate text-sm md:table-cell">
                        {obs.university?.name ?? '—'}
                      </TableCell>
                    )}

                    {/* Origin */}
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-muted-foreground rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">
                        {ORIGIN_LABEL[obs.origin] ?? obs.origin}
                      </span>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-muted-foreground text-sm">
                      {date}
                    </TableCell>

                    {/* Actions */}
                    {canWrite && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Editar observación"
                            onClick={() =>
                              setModal({ type: 'edit', item: obs })
                            }
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8"
                            aria-label="Eliminar observación"
                            onClick={() =>
                              setModal({ type: 'delete', item: obs })
                            }
                          >
                            <Trash2Icon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/*
        All three modals are always rendered — never conditional.
        The discriminated union ensures only one can be open at a time.
      */}
      <CreateObservationModal
        slug={slug}
        open={modal.type === 'create'}
        onOpenChange={(open) => !open && close()}
      />

      <EditObservationModal
        slug={slug}
        item={modal.type === 'edit' ? modal.item : null}
        open={modal.type === 'edit'}
        onOpenChange={(open) => !open && close()}
      />

      <DeleteObservationModal
        slug={slug}
        item={modal.type === 'delete' ? modal.item : null}
        open={modal.type === 'delete'}
        onOpenChange={(open) => !open && close()}
      />
    </div>
  );
}
