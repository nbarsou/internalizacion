'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { ObservationList } from '@/features/observations/components/observation-list';
import type { AgreementItem } from '@/features/agreements/db';
import type { ObservationItem } from '@/features/observations/db';

interface AgreementRowWithObservationsProps {
  agreement: AgreementItem;
  observations: ObservationItem[];
}

function statusClassName(value: string | undefined) {
  switch (value) {
    case 'Activo':
      return 'bg-green-600 text-white hover:bg-green-700';
    case 'En Negociación':
      return 'bg-yellow-500 text-white hover:bg-yellow-600';
    case 'Vencido':
      return 'bg-slate-200 text-slate-600 hover:bg-slate-300';
    case 'Desactivado':
      return 'bg-red-100 text-red-700 hover:bg-red-200';
    default:
      return 'bg-slate-100 text-slate-500';
  }
}

function ObservationIndicator({
  observations,
}: {
  observations: ObservationItem[];
}) {
  if (observations.length === 0) return null;

  // String literals — never import Prisma enums as values in client components
  const hasError = observations.some((o) => o.level === 'ERROR');
  const hasWarning = observations.some((o) => o.level === 'WARNING');

  const className = hasError
    ? 'bg-red-100 text-red-700 border-red-200'
    : hasWarning
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-blue-100 text-blue-700 border-blue-200';

  return (
    <Badge variant="outline" className={`ml-1.5 text-[10px] ${className}`}>
      {observations.length}
    </Badge>
  );
}

export function AgreementRowWithObservations({
  agreement,
  observations,
}: AgreementRowWithObservationsProps) {
  const [expanded, setExpanded] = useState(false);

  const { id, type, status, spots, beneficiaries, attrs } = agreement;

  const schoolNames = beneficiaries.map((b) => b.beneficiary.name);
  const attrNames = attrs.map((a) => a.attr.name);

  const hasObs = observations.length > 0;

  return (
    <>
      <TableRow
        className={hasObs ? 'hover:bg-muted/50 cursor-pointer' : undefined}
        onClick={hasObs ? () => setExpanded((v) => !v) : undefined}
      >
        {/* Expand toggle */}
        <TableCell className="w-8 pr-0">
          {hasObs ? (
            expanded ? (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            )
          ) : null}
        </TableCell>

        {/* Short ID */}
        <TableCell className="text-muted-foreground font-mono text-xs">
          {id.slice(0, 8)}…
        </TableCell>

        {/* Type + observation indicator */}
        <TableCell className="font-medium">
          <span className="flex items-center">
            {type?.name ?? '—'}
            <ObservationIndicator observations={observations} />
          </span>
        </TableCell>

        {/* Beneficiary schools */}
        <TableCell className="hidden md:table-cell">
          {schoolNames.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {schoolNames.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="h-5 px-1 py-0 text-[10px]"
                >
                  {s}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </TableCell>

        {/* Accreditations */}
        <TableCell className="hidden lg:table-cell">
          {attrNames.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {attrNames.map((a) => (
                <Badge
                  key={a}
                  variant="secondary"
                  className="h-5 px-1 py-0 text-[10px]"
                >
                  {a}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </TableCell>

        {/* Spots */}
        <TableCell className="hidden text-center md:table-cell">
          {spots != null ? (
            spots
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </TableCell>

        {/* Status */}
        <TableCell>
          <Badge className={statusClassName(status?.value)}>
            {status?.value ?? 'N/A'}
          </Badge>
        </TableCell>

        {/* Actions — stop propagation so dropdown doesn't toggle expand */}
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem>Ver detalles</DropdownMenuItem>
              <DropdownMenuItem>Editar plazas</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Archivar convenio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Inline observations panel — spans all columns */}
      {expanded && hasObs && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={8} className="bg-muted/30 px-8 py-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Observaciones del convenio
            </p>
            <ObservationList
              observations={observations}
              context="agreement"
              maxHeight="240px"
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
