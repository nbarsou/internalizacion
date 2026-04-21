'use client';

import { ColumnDef, Column } from '@tanstack/react-table';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ListFilter,
  ExternalLink,
  Check as CheckIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { AgreementItem } from '@/features/agreements/db';

// ── Column label map ──────────────────────────────────────────────────────────

export const AGREEMENT_COLUMN_LABELS: Record<string, string> = {
  university: 'Institución',
  country: 'País',
  type: 'Tipo',
  status: 'Estado',
  spots: 'Plazas',
  beneficiaries: 'Escuelas',
  attrs: 'Acreditaciones',
  link: 'Enlace',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// ── Header components (same pattern as universities) ─────────────────────────

type FilterOption = string | { label: string; value: string };

function FilterableHeader({
  column,
  label,
  options,
}: {
  column: Column<AgreementItem, unknown>;
  label: string;
  options: FilterOption[];
}) {
  const selected = new Set(column.getFilterValue() as string[] | undefined);
  const isFiltered = selected.size > 0;
  const normalised = options.map((o) =>
    typeof o === 'string' ? { label: o, value: o } : o
  );

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              isFiltered && 'text-primary bg-primary/10'
            )}
          >
            <ListFilter className="h-3.5 w-3.5" />
            <span className="sr-only">Filtrar {label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Buscar ${label.toLowerCase()}…`} />
            <CommandList>
              <CommandEmpty>Sin resultados.</CommandEmpty>
              <CommandGroup>
                {normalised.map((opt) => {
                  const isSel = selected.has(opt.value);
                  return (
                    <CommandItem
                      key={opt.value}
                      onSelect={() => {
                        if (isSel) selected.delete(opt.value);
                        else selected.add(opt.value);
                        const vals = Array.from(selected);
                        column.setFilterValue(vals.length ? vals : undefined);
                      }}
                    >
                      <div
                        className={cn(
                          'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                          isSel
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {selected.size > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => column.setFilterValue(undefined)}
                      className="justify-center text-center text-xs"
                    >
                      Limpiar filtro
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {isFiltered && (
        <Badge
          variant="secondary"
          className="h-5 rounded-full px-1.5 text-[10px]"
        >
          {selected.size}
        </Badge>
      )}
    </div>
  );
}

function SortableHeader({
  column,
  label,
}: {
  column: Column<AgreementItem, unknown>;
  label: string;
}) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1 font-medium"
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {label}
      {sorted === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
      {sorted === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
      {!sorted && (
        <ArrowUpDown className="text-muted-foreground/50 h-3.5 w-3.5" />
      )}
    </Button>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ value }: { value: string | undefined }) {
  const className = (() => {
    switch (value) {
      case 'Activo':
        return 'bg-green-600 text-white';
      case 'En Negociación':
        return 'bg-yellow-500 text-white';
      case 'Vencido':
        return 'bg-slate-200 text-slate-600';
      case 'Desactivado':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  })();
  return <Badge className={className}>{value ?? 'N/A'}</Badge>;
}

// ── Column builder ────────────────────────────────────────────────────────────

export function buildAgreementColumns(opts: {
  types: string[];
  statuses: string[];
  beneficiaries: string[];
  attrs: string[];
}): ColumnDef<AgreementItem>[] {
  return [
    // University name + country + city folded underneath
    {
      id: 'university',
      accessorFn: (row) => row.university?.name ?? '',
      header: ({ column }) => (
        <SortableHeader column={column} label="Institución" />
      ),
      cell: ({ row }) => {
        const u = row.original.university;
        if (!u) return <span className="text-muted-foreground text-xs">—</span>;
        const meta = [u.country?.name, u.city].filter(Boolean).join(', ');
        return (
          <div className="flex max-w-[240px] flex-col gap-0.5">
            <Link
              href={`/universities/${u.slug}`}
              className="text-primary truncate text-sm font-semibold hover:underline"
              title={u.name}
            >
              {truncate(u.name, 36)}
            </Link>
            {meta && (
              <span className="text-muted-foreground truncate text-xs">
                {meta}
              </span>
            )}
          </div>
        );
      },
    },

    // Agreement type — filterable, truncated
    {
      id: 'type',
      accessorFn: (row) => row.type?.name ?? '',
      header: ({ column }) => (
        <FilterableHeader column={column} label="Tipo" options={opts.types} />
      ),
      cell: ({ row }) => {
        const name = row.original.type?.name;
        if (!name)
          return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <span className="block max-w-[140px] truncate text-sm" title={name}>
            {truncate(name, 22)}
          </span>
        );
      },
      filterFn: (row, _id, value: string[]) =>
        value.includes(row.original.type?.name ?? ''),
    },

    // Status — filterable
    {
      id: 'status',
      accessorFn: (row) => row.status?.value ?? '',
      header: ({ column }) => (
        <FilterableHeader
          column={column}
          label="Estado"
          options={opts.statuses}
        />
      ),
      cell: ({ row }) => <StatusBadge value={row.original.status?.value} />,
      filterFn: (row, _id, value: string[]) =>
        value.includes(row.original.status?.value ?? ''),
    },

    // Spots — sortable
    {
      id: 'spots',
      accessorFn: (row) => row.spots ?? -1,
      header: ({ column }) => <SortableHeader column={column} label="Plazas" />,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original.spots != null ? (
            row.original.spots
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      ),
    },

    // Beneficiary schools — filterable, capped at 2 + overflow
    {
      id: 'beneficiaries',
      accessorFn: (row) =>
        row.beneficiaries.map((b) => b.beneficiary.name).join(' '),
      header: ({ column }) => (
        <FilterableHeader
          column={column}
          label="Escuelas"
          options={opts.beneficiaries}
        />
      ),
      cell: ({ row }) => {
        const names = row.original.beneficiaries.map((b) => b.beneficiary.name);
        if (names.length === 0)
          return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="flex max-w-[180px] flex-wrap gap-1">
            {names.slice(0, 2).map((n) => (
              <Badge
                key={n}
                variant="outline"
                className="h-5 max-w-[80px] truncate px-1 py-0 text-[10px]"
                title={n}
              >
                {truncate(n, 10)}
              </Badge>
            ))}
            {names.length > 2 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                +{names.length - 2}
              </Badge>
            )}
          </div>
        );
      },
      filterFn: (row, _id, value: string[]) =>
        value.some((v) =>
          row.original.beneficiaries.some((b) => b.beneficiary.name === v)
        ),
    },

    // Accreditations — filterable
    {
      id: 'attrs',
      accessorFn: (row) => row.attrs.map((a) => a.attr.name).join(' '),
      header: ({ column }) => (
        <FilterableHeader
          column={column}
          label="Acreditaciones"
          options={opts.attrs}
        />
      ),
      cell: ({ row }) => {
        const names = row.original.attrs.map((a) => a.attr.name);
        if (names.length === 0)
          return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {names.map((n) => (
              <Badge
                key={n}
                variant="secondary"
                className="h-5 px-1 py-0 text-[10px]"
              >
                {n}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: (row, _id, value: string[]) =>
        value.some((v) => row.original.attrs.some((a) => a.attr.name === v)),
    },

    // Link to document
    {
      id: 'link',
      accessorFn: (row) => row.link_convenio ?? '',
      header: 'Enlace',
      cell: ({ row }) => {
        const link = row.original.link_convenio;
        if (!link)
          return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Ver doc
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      },
    },
  ];
}
