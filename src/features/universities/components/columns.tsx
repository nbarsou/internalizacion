'use client';

import { ColumnDef, Column } from '@tanstack/react-table';
import {
  ExternalLink,
  GraduationCap,
  Activity,
  Check,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ListFilter,
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
import { Check as CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UniversityListItem } from '@/features/universities/db';

// ── Column label map ──────────────────────────────────────────────────────────
// Used by the column manager panel to show human-readable names.

export const COLUMN_LABELS: Record<string, string> = {
  name: 'Nombre',
  country: 'País',
  city: 'Ciudad',
  region: 'Región',
  campus: 'Campus',
  institutionType: 'Tipo',
  utilization: 'Uso',
  isCatholic: 'Católica',
  agreementType: 'Tipo convenio',
  start: 'Inicio',
  expires: 'Vigencia',
  agreements: 'Convenios',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function yearOf(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).getFullYear().toString();
}

// ── Sortable + filterable header ──────────────────────────────────────────────

function SortableHeader({
  column,
  label,
}: {
  column: Column<UniversityListItem, unknown>;
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

// Standalone sort icon button — used alongside FilterableHeader
function SortButton({
  column,
}: {
  column: Column<UniversityListItem, unknown>;
}) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {sorted === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
      {sorted === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
      {!sorted && (
        <ArrowUpDown className="text-muted-foreground/50 h-3.5 w-3.5" />
      )}
    </Button>
  );
}

// Inline popover filter in the column header
function FilterableHeader({
  column,
  label,
  options,
}: {
  column: Column<UniversityListItem, unknown>;
  label: string;
  options: string[] | { label: string; value: string }[];
}) {
  const selected = new Set(column.getFilterValue() as string[] | undefined);
  const isFiltered = selected.size > 0;

  // Normalise to {label, value} regardless of input shape
  const normalised = (
    options as Array<string | { label: string; value: string }>
  ).map((o) => (typeof o === 'string' ? { label: o, value: o } : o));

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
        <PopoverContent className="w-[200px] p-0" align="start">
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

// Text search in column header — for free-text fields like city
function SearchableHeader({
  column,
  label,
}: {
  column: Column<UniversityListItem, unknown>;
  label: string;
}) {
  const value = (column.getFilterValue() as string) ?? '';
  const isFiltered = value.length > 0;

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
            <span className="sr-only">Buscar {label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2" align="start">
          <input
            className="border-input bg-background placeholder:text-muted-foreground w-full rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-orange-500"
            placeholder={`Buscar ${label.toLowerCase()}…`}
            value={value}
            onChange={(e) => column.setFilterValue(e.target.value || undefined)}
          />
          {isFiltered && (
            <button
              className="text-muted-foreground hover:text-foreground mt-1.5 w-full text-center text-xs"
              onClick={() => column.setFilterValue(undefined)}
            >
              Limpiar
            </button>
          )}
        </PopoverContent>
      </Popover>
      {isFiltered && (
        <Badge
          variant="secondary"
          className="h-5 rounded-full px-1.5 text-[10px]"
        >
          1
        </Badge>
      )}
    </div>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────

export function buildColumns(opts: {
  countries: string[];
  campuses: string[];
  utilizations: string[];
  regions: string[];
  agreementTypes: string[];
  institutionTypes: string[];
  startYears: string[];
  expiresYears: string[];
}): ColumnDef<UniversityListItem>[] {
  return [
    // Name — truncated, links to detail page
    {
      accessorKey: 'name',
      id: 'name',
      header: ({ column }) => <SortableHeader column={column} label="Nombre" />,
      cell: ({ row }) => {
        const { slug, name, pagina_web } = row.original;
        return (
          <div className="flex max-w-[220px] min-w-0 flex-col gap-0.5">
            <Link
              href={`/universities/${slug}`}
              className="text-primary truncate text-sm font-semibold hover:underline"
              title={name}
            >
              {truncate(name, 40)}
            </Link>
            {pagina_web && (
              <a
                href={pagina_web}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground flex items-center gap-0.5 text-xs hover:text-blue-600"
              >
                Sitio web <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        );
      },
    },

    // Country — filterable header
    {
      id: 'country',
      accessorFn: (row) => row.country?.name ?? '',
      header: ({ column }) => (
        <FilterableHeader
          column={column}
          label="País"
          options={opts.countries}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.country?.name ?? '—'}</span>
      ),
      filterFn: (row, _id, value: string[]) =>
        value.includes(row.original.country?.name ?? ''),
    },

    // Region — filterable header
    {
      id: 'region',
      accessorFn: (row) => row.region?.name ?? '',
      header: ({ column }) => (
        <FilterableHeader
          column={column}
          label="Región"
          options={opts.regions}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.region?.name ?? '—'}
        </span>
      ),
      filterFn: (row, _id, value: string[]) =>
        value.includes(row.original.region?.name ?? ''),
    },

    // Campus — filterable header
    {
      id: 'campus',
      accessorFn: (row) => row.campus?.name ?? '',
      header: ({ column }) => (
        <FilterableHeader
          column={column}
          label="Campus"
          options={opts.campuses}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.campus?.name ?? '—'}</span>
      ),
      filterFn: (row, _id, value: string[]) =>
        value.includes(row.original.campus?.name ?? ''),
    },

    // City — text search in header
    {
      id: 'city',
      accessorFn: (row) => row.city ?? '',
      header: ({ column }) => (
        <SearchableHeader column={column} label="Ciudad" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.city ?? '—'}
        </span>
      ),
      filterFn: 'includesString',
    },

    // Agreement type — faceted filter on which types this university has
    {
      id: 'agreementType',
      // accessorFn returns all type names for this university as a joined string
      // so global search can find them, but filtering uses the custom filterFn
      accessorFn: (row) =>
        row.agreements.map((a) => a.type?.name ?? '').join(' '),
      header: ({ column }) => (
        <FilterableHeader
          column={column}
          label="Tipo convenio"
          options={opts.agreementTypes}
        />
      ),
      cell: ({ row }) => {
        const types = Array.from(
          new Set(
            row.original.agreements
              .map((a) => a.type?.name)
              .filter((n): n is string => !!n)
          )
        );
        if (types.length === 0)
          return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {types.slice(0, 2).map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="h-5 px-1.5 text-[10px] font-normal"
              >
                {truncate(t, 18)}
              </Badge>
            ))}
            {types.length > 2 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                +{types.length - 2}
              </Badge>
            )}
          </div>
        );
      },
      filterFn: (row, _id, value: string[]) =>
        value.some((v) =>
          row.original.agreements.some((a) => a.type?.name === v)
        ),
    },
    {
      id: 'institutionType',
      accessorFn: (row) => row.institutionType?.name ?? '',
      header: ({ column }) => (
        <FilterableHeader
          column={column}
          label="Tipo"
          options={opts.institutionTypes}
        />
      ),
      cell: ({ row }) => {
        const t = row.original.institutionType?.name;
        return t ? (
          <Badge
            variant="outline"
            className="border-orange-200 bg-orange-50 font-normal text-orange-700"
          >
            <GraduationCap className="mr-1 h-3 w-3" />
            {truncate(t, 22)}
          </Badge>
        ) : null;
      },
      filterFn: (row, _id, value: string[]) =>
        value.includes(row.original.institutionType?.name ?? ''),
    },

    // Utilization — filterable header + coloured badge
    {
      id: 'utilization',
      accessorFn: (row) => row.utilization?.value ?? '',
      header: ({ column }) => (
        <FilterableHeader
          column={column}
          label="Uso"
          options={opts.utilizations}
        />
      ),
      cell: ({ row }) => {
        const u = row.original.utilization;
        return u ? (
          <Badge
            variant="secondary"
            style={{
              backgroundColor: u.color ? `${u.color}20` : undefined,
              color: u.color ?? 'inherit',
              borderColor: u.color ?? undefined,
            }}
            className="border text-xs"
          >
            <Activity className="mr-1 h-3 w-3" />
            {u.value}
          </Badge>
        ) : null;
      },
      filterFn: (row, _id, value: string[]) =>
        value.includes(row.original.utilization?.value ?? ''),
    },

    // Catholic flag — filterable header
    {
      id: 'isCatholic',
      accessorKey: 'isCatholic',
      header: ({ column }) => (
        <FilterableHeader
          column={column}
          label="Católica"
          options={[
            { label: '✓ Sí', value: 'yes' },
            { label: '✗ No', value: 'no' },
          ]}
        />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.isCatholic ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="text-muted-foreground/30 h-4 w-4" />
          )}
        </div>
      ),
      filterFn: (row, _id, value: string[]) => {
        if (value.includes('yes') && row.original.isCatholic) return true;
        if (value.includes('no') && !row.original.isCatholic) return true;
        return false;
      },
    },

    // Start year — filterable + sortable
    {
      id: 'start',
      accessorFn: (row) => yearOf(row.start),
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <FilterableHeader
            column={column}
            label="Inicio"
            options={opts.startYears}
          />
          <SortButton column={column} />
        </div>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">
          {yearOf(row.original.start)}
        </span>
      ),
      filterFn: (row, _id, value: string[]) =>
        value.includes(yearOf(row.original.start)),
    },

    // Expiry year — filterable + sortable, highlights expired rows
    {
      id: 'expires',
      accessorFn: (row) => yearOf(row.expires),
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <FilterableHeader
            column={column}
            label="Vigencia"
            options={opts.expiresYears}
          />
          <SortButton column={column} />
        </div>
      ),
      cell: ({ row }) => {
        const y = yearOf(row.original.expires);
        const isExpired =
          row.original.expires && new Date(row.original.expires) < new Date();
        return (
          <span
            className={cn(
              'text-sm tabular-nums',
              y === '—'
                ? 'text-muted-foreground'
                : isExpired
                  ? 'font-medium text-red-600'
                  : 'text-muted-foreground'
            )}
          >
            {y === '—' ? 'Indefinido' : y}
          </span>
        );
      },
      filterFn: (row, _id, value: string[]) => {
        const y = yearOf(row.original.expires);
        // "Indefinido" rows are selectable by filtering for '—'
        return value.includes(y === '—' ? '—' : y);
      },
    },

    // Agreement count
    {
      id: 'agreements',
      accessorFn: (row) => row._count.agreements,
      header: ({ column }) => (
        <SortableHeader column={column} label="Convenios" />
      ),
      cell: ({ getValue }) => (
        <div className="text-center">
          <Badge
            variant="secondary"
            className="rounded-full px-2.5 tabular-nums"
          >
            {getValue() as number}
          </Badge>
        </div>
      ),
    },
  ];
}
