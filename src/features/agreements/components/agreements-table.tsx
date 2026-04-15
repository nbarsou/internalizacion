import { Download, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AgreementItem } from '@/features/agreements/db';
import type { ObservationItem } from '@/features/observations/db';
import { AgreementRowWithObservations } from './agreements-row-observation';

interface AgreementsTableProps {
  universityName: string;
  agreements: AgreementItem[];
  /**
   * All university-scoped observations. This component filters them
   * by agreementId so each row only sees its own observations.
   */
  observations: ObservationItem[];
}

export function AgreementsTable({
  universityName,
  agreements,
  observations,
}: AgreementsTableProps) {
  const count = agreements.length;

  // Group observations by agreementId once — O(n) instead of O(n*m)
  const obsByAgreement = observations.reduce<Record<string, ObservationItem[]>>(
    (acc, obs) => {
      if (!obs.agreementId) return acc;
      (acc[obs.agreementId] ??= []).push(obs);
      return acc;
    },
    {}
  );
  console.log(obsByAgreement.length);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Convenios con {universityName}</CardTitle>
          <CardDescription>
            {count} acuerdo{count !== 1 ? 's' : ''} registrado
            {count !== 1 ? 's' : ''} con esta institución.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">Filtrar</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Download className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">Exportar</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {count === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-sm">
            <p>No hay convenios registrados para esta universidad.</p>
            <Button
              size="sm"
              className="mt-2 bg-orange-600 text-white hover:bg-orange-700"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Agregar primer convenio
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-8" />
                  <TableHead className="w-[90px]">ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Escuelas beneficiarias
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Acreditaciones
                  </TableHead>
                  <TableHead className="hidden text-center md:table-cell">
                    Plazas
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreements.map((a) => (
                  <AgreementRowWithObservations
                    key={a.id}
                    agreement={a}
                    observations={obsByAgreement[a.id] ?? []}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
