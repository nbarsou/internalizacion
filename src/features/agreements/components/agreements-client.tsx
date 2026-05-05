'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, Trash2Icon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateAgreementModal } from './create-agreement-modal';
import { EditAgreementModal } from './edit-agreement-modal';
import { DeleteAgreementModal } from './delete-agreement-modal';
import type { AgreementsByUniversityDTO } from '../db';
import { AllRefs } from '@/features/refs/db';

type ModalState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; item: AgreementsByUniversityDTO }
  | { type: 'delete'; item: AgreementsByUniversityDTO };

interface AgreementsClientProps {
  universityId: string;
  universitySlug: string;
  agreements: AgreementsByUniversityDTO[];
  refs: AllRefs;
  canWrite: boolean;
}

export function AgreementsClient({
  universityId,
  universitySlug,
  agreements,
  refs,
  canWrite,
}: AgreementsClientProps) {
  const [modal, setModal] = useState<ModalState>({ type: 'closed' });

  const close = () => setModal({ type: 'closed' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Convenios</h2>
          <p className="text-muted-foreground text-sm">
            {agreements.length}{' '}
            {agreements.length === 1 ? 'convenio' : 'convenios'}
          </p>
        </div>

        {canWrite && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = `/api/export/agreements?universityId=${universityId}`;
                  }}
                >
                  Exportar para SUAS
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" onClick={() => setModal({ type: 'create' })}>
              <PlusIcon className="mr-1.5 h-4 w-4" />
              Nuevo convenio
            </Button>
          </div>
        )}
      </div>

      {agreements.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          Sin convenios. Crea el primero con el botón de arriba.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Plazas</TableHead>
                <TableHead>Beneficiarios</TableHead>
                {canWrite && (
                  <>
                    <TableHead>Enlace</TableHead>
                    <TableHead className="w-25 text-right">Acciones</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {agreements.map((agreement) => (
                <TableRow key={agreement.id}>
                  <TableCell className="font-medium">
                    {agreement.type.value}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{agreement.status.value}</Badge>
                  </TableCell>
                  <TableCell>
                    {agreement.spots !== null &&
                    agreement.spots !== undefined ? (
                      agreement.spots
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {agreement.beneficiaries.map((b) => (
                        <Badge
                          key={b.beneficiaryId}
                          variant="secondary"
                          className="text-xs"
                        >
                          {b.beneficiary.value}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  {canWrite && (
                    <TableCell>
                      {agreement.link_convenio ? (
                        <a href={agreement.link_convenio}>Ver</a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  {canWrite && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground h-8 w-8"
                          aria-label="Editar convenio"
                          onClick={() =>
                            setModal({ type: 'edit', item: agreement })
                          }
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive h-8 w-8"
                          aria-label="Eliminar convenio"
                          onClick={() =>
                            setModal({ type: 'delete', item: agreement })
                          }
                        >
                          <Trash2Icon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modals ALWAYS rendered */}
      <CreateAgreementModal
        universityId={universityId}
        universitySlug={universitySlug}
        refs={refs}
        open={modal.type === 'create'}
        onOpenChange={(open) => !open && close()}
      />

      <EditAgreementModal
        universitySlug={universitySlug}
        refs={refs}
        agreement={modal.type === 'edit' ? modal.item : null}
        open={modal.type === 'edit'}
        onOpenChange={(open) => !open && close()}
      />
      <DeleteAgreementModal
        universitySlug={universitySlug}
        item={modal.type === 'delete' ? modal.item : null}
        open={modal.type === 'delete'}
        onOpenChange={(open) => !open && close()}
      />
    </div>
  );
}
