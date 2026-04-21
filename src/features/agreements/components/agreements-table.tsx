'use client';

import { useState } from 'react';
import { Download, Filter, Plus, Pencil } from 'lucide-react';
import Link from 'next/link';
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
import { AgreementRowWithObservations } from './agreements-row-observation';
import type { AgreementItem } from '@/features/agreements/db';
import type { ObservationItem } from '@/features/observations/db';

interface AgreementsTableProps {
  universityId: string;
  universitySlug: string;
  universityName: string;
  agreements: AgreementItem[];
  observations: ObservationItem[];
}

export function AgreementsTable({
  universityId,
  universitySlug,
  universityName,
  agreements: initialAgreements,
  observations,
}: AgreementsTableProps) {
  const [agreements, setAgreements] = useState(initialAgreements);

  const obsByAgreement = observations.reduce<Record<string, ObservationItem[]>>(
    (acc, obs) => {
      if (!obs.agreementId) return acc;
      (acc[obs.agreementId] ??= []).push(obs);
      return acc;
    },
    {}
  );

  function handleDeleted(id: string) {
    setAgreements((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Convenios con {universityName}</CardTitle>
          <CardDescription>
            {agreements.length} acuerdo{agreements.length !== 1 ? 's' : ''}{' '}
            registrado
            {agreements.length !== 1 ? 's' : ''} con esta institución.
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
          <Button
            size="sm"
            className="h-8 gap-1 bg-orange-600 text-white hover:bg-orange-700"
            asChild
          >
            <Link href={`/universities/${universitySlug}/agreements/create`}>
              <Plus className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Nuevo convenio</span>
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {agreements.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-sm">
            <p>No hay convenios registrados para esta universidad.</p>
            <Button
              size="sm"
              className="mt-2 bg-orange-600 text-white hover:bg-orange-700"
              asChild
            >
              <Link href={`/universities/${universitySlug}/agreements/create`}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Agregar primer convenio
              </Link>
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
                    editHref={`/universities/${universitySlug}/agreements/${a.id}/edit`}
                    onDeleted={() => handleDeleted(a.id)}
                    universityId={universityId}
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
