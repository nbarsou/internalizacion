'use client';

import { useState } from 'react';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import type { RefTableName } from '../schemas';
import { CreateRefModal } from './create-ref-modal';
import { EditRefModal } from './edit-ref-modal';
import { DeleteRefModal } from './delete-ref-modal';

// ── Types & State ────────────────────────────────────────────────────────────

export interface ValueRow {
  id: number;
  value: string;
  color: string | null;
  _count: Record<string, number>;
}

type ModalState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; item: ValueRow }
  | { type: 'delete'; item: ValueRow };

// ── Props ────────────────────────────────────────────────────────────────────

interface RefAccordionSectionProps {
  value: string;
  title: string;
  table: RefTableName;
  rows: ValueRow[];
  countKey: string;
  usedByLabel: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function RefAccordionSection({
  value,
  title,
  table,
  rows,
  countKey,
}: RefAccordionSectionProps) {
  // Discriminated union guards our modal states
  const [modal, setModal] = useState<ModalState>({ type: 'closed' });
  const close = () => setModal({ type: 'closed' });

  const totalUses = rows.reduce(
    (sum, row) => sum + (row._count[countKey] ?? 0),
    0
  );

  const unusedCount = rows.filter(
    (row) => (row._count[countKey] ?? 0) === 0
  ).length;

  return (
    <AccordionItem
      value={value}
      className="bg-card rounded-lg border px-4 data-[state=open]:shadow-sm"
    >
      <AccordionTrigger className="hover:no-underline">
        <div className="flex w-full items-center gap-3 pr-2">
          <span className="font-medium">{title}</span>
          <span className="text-muted-foreground text-xs">
            {rows.length} {rows.length === 1 ? 'registro' : 'registros'}
            {totalUses > 0 && (
              <>
                {' · '}
                {totalUses} {totalUses === 1 ? 'uso' : 'usos'}
              </>
            )}
            {unusedCount > 0 && rows.length > 0 && (
              <>
                {' · '}
                <span className="text-amber-600">{unusedCount} sin uso</span>
              </>
            )}
          </span>
          <span className="ml-auto" aria-hidden />
        </div>
      </AccordionTrigger>

      <AccordionContent className="pb-4">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-muted-foreground text-sm">
              Aún no hay registros en {title.toLowerCase()}.
            </p>
            <Button onClick={() => setModal({ type: 'create' })} size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Agregar {title}
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                Haz clic en el color para cambiarlo. Los cambios se aplican de
                inmediato a todos los registros que usan estos valores.
              </p>
              <Button onClick={() => setModal({ type: 'create' })} size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </div>

            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-10" aria-label="Color" />
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-20 text-right">Usos</TableHead>
                    <TableHead className="w-24 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const usedCount = row._count[countKey] ?? 0;
                    const isUnused = usedCount === 0;

                    return (
                      <TableRow
                        key={row.id}
                        className="group hover:bg-muted/30"
                      >
                        <TableCell>
                          {row.color ? (
                            <div
                              className="h-6 w-6 rounded-full border border-black/10 shadow-sm dark:border-white/10"
                              style={{ backgroundColor: row.color }}
                              title={row.color} // Shows the hex code when hovering
                              aria-hidden="true"
                            />
                          ) : (
                            // Fallback if the color is null or empty
                            <div
                              className="bg-muted/50 h-6 w-6 rounded-full border border-dashed"
                              title="Sin color"
                              aria-hidden="true"
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.value}
                        </TableCell>

                        <TableCell className="text-right">
                          <Badge
                            variant={isUnused ? 'outline' : 'secondary'}
                            className={
                              isUnused
                                ? 'text-muted-foreground tabular-nums'
                                : 'tabular-nums'
                            }
                          >
                            {usedCount}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setModal({ type: 'edit', item: row })
                              }
                            >
                              <PencilIcon className="h-4 w-4" />
                              <span className="sr-only">
                                Editar {row.value}
                              </span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive h-8 w-8"
                              onClick={() =>
                                setModal({ type: 'delete', item: row })
                              }
                            >
                              <Trash2Icon className="h-4 w-4" />
                              <span className="sr-only">
                                Eliminar {row.value}
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* ── Modals are mounted once per section ── */}
        <CreateRefModal
          table={table}
          title={title}
          open={modal.type === 'create'}
          onOpenChange={(open) => !open && close()}
        />

        <EditRefModal
          table={table}
          title={title}
          item={modal.type === 'edit' ? modal.item : null}
          open={modal.type === 'edit'}
          onOpenChange={(open) => !open && close()}
        />

        <DeleteRefModal
          table={table}
          title={title}
          item={modal.type === 'delete' ? modal.item : null}
          open={modal.type === 'delete'}
          onOpenChange={(open) => !open && close()}
        />
      </AccordionContent>
    </AccordionItem>
  );
}
