import { MoreHorizontal } from 'lucide-react';
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
import type { AgreementItem } from '@/features/agreements/db';

interface AgreementRowProps {
  agreement: AgreementItem;
}

function statusVariant(value: string | undefined) {
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

export function AgreementRow({ agreement }: AgreementRowProps) {
  const { id, type, status, spots, beneficiaries, attrs } = agreement;

  const schoolNames = beneficiaries
    .map((b) => b.beneficiary.name)
    .filter(Boolean);

  const attrNames = attrs.map((a) => a.attr.name);

  return (
    <TableRow>
      {/* Short ID */}
      <TableCell className="text-muted-foreground font-mono text-xs">
        {id.slice(0, 8)}…
      </TableCell>

      {/* Agreement type */}
      <TableCell className="font-medium">{type?.name ?? '—'}</TableCell>

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
        <Badge className={statusVariant(status?.value)}>
          {status?.value ?? 'N/A'}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
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
  );
}
