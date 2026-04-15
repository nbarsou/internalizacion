import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UniversityListItem } from '@/features/universities/db';
import { UniversityRow } from './university-row';

interface UniversitiesTableProps {
  universities: UniversityListItem[];
}

export function UniversitiesTable({ universities }: UniversitiesTableProps) {
  if (universities.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border py-12 text-center text-sm">
        No se encontraron instituciones.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[80px]">Logo</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead className="hidden md:table-cell">Tipo</TableHead>
            <TableHead className="text-center">Convenios</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {universities.map((uni) => (
            <UniversityRow key={uni.id} university={uni} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
