import { Badge } from '@/components/ui/badge';
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
import { EditRefDialog } from './edit-ref-dialog';
import { DeleteRefDialog } from './del-ref-dialog';
import { CreateRefDialog } from './create-ref-dialog';
import type { CreateFields } from './create-ref-dialog';
import type { RefTableName } from '@/features/refs/db';

// ── Row shapes ────────────────────────────────────────────────────────────────

export interface NameRow {
  id: number;
  name: string;
  _count: Record<string, number>;
}
export interface ValueRow {
  id: number;
  value: string;
  color: string | null;
  _count: Record<string, number>;
}
export interface BenefRow {
  id: number;
  cve: string;
  name: string;
  _count: Record<string, number>;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface RefAccordionSectionProps<
  T extends { id: number; _count: Record<string, number> },
> {
  value: string;
  title: string;
  table: RefTableName;
  rows: T[];
  countKey: string;
  usedByLabel: string;
  createFields: CreateFields;
  renderLabel: (row: T) => React.ReactNode;
  renderExtra?: (row: T) => React.ReactNode;
  extraHeader?: string;
  editField?: 'name' | 'value';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RefAccordionSection<
  T extends { id: number; _count: Record<string, number> },
>({
  value,
  title,
  table,
  rows,
  countKey,
  usedByLabel,
  createFields,
  renderLabel,
  renderExtra,
  extraHeader,
  editField = 'name',
}: RefAccordionSectionProps<T>) {
  return (
    <AccordionItem value={value} className="rounded-lg border px-4">
      {/*
        AccordionTrigger renders a <button> that is flex with space-between
        internally. We use w-full + flex to align:
          left  → title
          right → count badge  +  chevron (AccordionTrigger handles chevron)
      */}
      <AccordionTrigger className="hover:no-underline">
        {/*
          AccordionTrigger is flex + space-between internally (title area | chevron).
          We fill the title area with a flex row: title on the left, count badge
          pushed to the right via ml-auto, then the chevron sits outside our div.
        */}
        <div className="flex w-full items-center gap-3 pr-2">
          <span className="font-medium">{title}</span>
          <Badge
            variant="secondary"
            className="mr-2 ml-auto rounded-full px-2 text-xs tabular-nums"
          >
            {rows.length}
          </Badge>
        </div>
      </AccordionTrigger>

      <AccordionContent>
        {/* Toolbar: Add button */}
        <div className="mb-3 flex justify-end">
          <CreateRefDialog table={table} fields={createFields} title={title} />
        </div>

        {rows.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Sin registros. Agrega el primero.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nombre</TableHead>
                  {extraHeader && (
                    <TableHead className="hidden sm:table-cell">
                      {extraHeader}
                    </TableHead>
                  )}
                  <TableHead className="w-20 text-right">Usos</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const usedCount = row._count[countKey] ?? 0;
                  const nameForDisplay =
                    'name' in row
                      ? (row as unknown as { name: string }).name
                      : 'value' in row
                        ? (row as unknown as { value: string }).value
                        : String(row.id);

                  return (
                    <TableRow key={row.id}>
                      <TableCell>{renderLabel(row)}</TableCell>

                      {extraHeader && (
                        <TableCell className="hidden sm:table-cell">
                          {renderExtra?.(row)}
                        </TableCell>
                      )}

                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            usedCount > 0
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'text-muted-foreground'
                          }
                        >
                          {usedCount}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <EditRefDialog
                            table={table}
                            id={row.id}
                            currentName={nameForDisplay}
                            field={editField}
                          />
                          <DeleteRefDialog
                            table={table}
                            id={row.id}
                            name={nameForDisplay}
                            usedCount={usedCount}
                            usedByLabel={usedByLabel}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
