'use client';

import * as React from 'react';
import {
  ColumnFiltersState,
  ColumnOrderState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Search,
  Settings2,
  FilterX,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  RotateCcw,
  GripVertical,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  buildAgreementColumns,
  AGREEMENT_COLUMN_LABELS,
} from './agreements-columns';
import type { AgreementItem } from '@/features/agreements/db';

// ── Helpers ───────────────────────────────────────────────────────────────────

function unique(items: (string | null | undefined)[]): string[] {
  return Array.from(new Set(items.filter((x): x is string => !!x))).sort();
}

const DEFAULT_COLUMN_ORDER: ColumnOrderState = [
  'university',
  'type',
  'status',
  'spots',
  'beneficiaries',
  'attrs',
  'link',
];

// ── Draggable header cell ─────────────────────────────────────────────────────

function DraggableHeader({
  colId,
  children,
}: {
  colId: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: colId });
  return (
    <TableHead
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : undefined,
      }}
      className="whitespace-nowrap"
    >
      <div className="flex items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab touch-none active:cursor-grabbing"
          tabIndex={-1}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        {children}
      </div>
    </TableHead>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface AgreementsClientTableProps {
  data: AgreementItem[];
}

export function AgreementsClientTable({ data }: AgreementsClientTableProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] =
    React.useState<ColumnOrderState>(DEFAULT_COLUMN_ORDER);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const filterOpts = React.useMemo(
    () => ({
      types: unique(data.map((d) => d.type?.name)),
      statuses: unique(data.map((d) => d.status?.value)),
      beneficiaries: unique(
        data.flatMap((d) => d.beneficiaries.map((b) => b.beneficiary.name))
      ),
      attrs: unique(data.flatMap((d) => d.attrs.map((a) => a.attr.name))),
    }),
    [data]
  );

  const columns = React.useMemo(
    () => buildAgreementColumns(filterOpts),
    [filterOpts]
  );

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, columnVisibility, columnOrder, globalFilter },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setColumnOrder((prev) => {
      const oldIdx = prev.indexOf(active.id as string);
      const newIdx = prev.indexOf(over.id as string);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  const isFiltered = columnFilters.length > 0 || globalFilter.length > 0;
  const isReordered =
    JSON.stringify(columnOrder) !== JSON.stringify(DEFAULT_COLUMN_ORDER);
  const visibleColIds = table.getVisibleLeafColumns().map((col) => col.id);

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Buscar convenio…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-8 pl-8"
            />
          </div>
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                table.resetColumnFilters();
                setGlobalFilter('');
              }}
            >
              <FilterX className="h-3.5 w-3.5" />
              Limpiar filtros
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 gap-1.5',
                isReordered && 'border-orange-300 text-orange-600'
              )}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Columnas
              {isReordered && (
                <span className="ml-1 rounded bg-orange-100 px-1 text-[10px] text-orange-600">
                  reordenado
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0 text-xs">
                Mostrar columnas
              </DropdownMenuLabel>
              {isReordered && (
                <button
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[10px]"
                  onClick={() => setColumnOrder(DEFAULT_COLUMN_ORDER)}
                >
                  <RotateCcw className="h-3 w-3" />
                  Restaurar
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  className="text-sm"
                >
                  {AGREEMENT_COLUMN_LABELS[col.id] ?? col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Table with drag-to-reorder headers ── */}
      <DndContext
        id="agreements-table-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40">
                  <SortableContext
                    items={visibleColIds}
                    strategy={horizontalListSortingStrategy}
                  >
                    {hg.headers.map((header) => (
                      <DraggableHeader key={header.id} colId={header.column.id}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </DraggableHeader>
                    ))}
                  </SortableContext>
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-sm"
                  >
                    {isFiltered
                      ? 'Ningún convenio coincide con los filtros.'
                      : 'Sin convenios registrados.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DndContext>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-muted-foreground text-sm">
          {table.getFilteredRowModel().rows.length === data.length
            ? `${data.length} convenios`
            : `${table.getFilteredRowModel().rows.length} de ${data.length} convenios`}
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground hidden text-sm lg:block">
              Filas
            </p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[64px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50].map((n) => (
                  <SelectItem key={n} value={`${n}`}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm font-medium">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
