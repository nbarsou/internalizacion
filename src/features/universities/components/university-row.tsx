import { Building2, ExternalLink, GraduationCap } from 'lucide-react';
import Link from 'next/link';

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
import { MoreHorizontal } from 'lucide-react';
import type { UniversityListItem } from '@/features/universities/db';

interface UniversityRowProps {
  university: UniversityListItem;
}

export function UniversityRow({ university }: UniversityRowProps) {
  const { slug, name, city, pagina_web, country, institutionType, _count } =
    university;

  const agreementCount = _count.agreements;

  return (
    <TableRow>
      {/* Logo placeholder */}
      <TableCell>
        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
          <Building2 className="text-muted-foreground h-5 w-5" />
        </div>
      </TableCell>

      {/* Name + website */}
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <Link
            href={`/universities/${slug}`}
            className="text-base hover:underline"
          >
            {name}
          </Link>
          {pagina_web && (
            <a
              href={pagina_web}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              {pagina_web}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </TableCell>

      {/* Location */}
      <TableCell>
        <span className="text-sm">
          {[city, country?.name].filter(Boolean).join(', ')}
        </span>
      </TableCell>

      {/* Institution type */}
      <TableCell className="hidden md:table-cell">
        <span className="text-muted-foreground flex items-center gap-1 text-sm">
          <GraduationCap className="h-3 w-3" />
          {institutionType?.name ?? '—'}
        </span>
      </TableCell>

      {/* Agreement count */}
      <TableCell className="text-center">
        <Link href={`/universities/${slug}`}>
          <Badge
            variant="secondary"
            className="cursor-pointer rounded-full px-3 transition-colors hover:bg-orange-100"
          >
            {agreementCount}
          </Badge>
        </Link>
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
            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/universities/${slug}`}>Ver Convenios</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Editar Información</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
