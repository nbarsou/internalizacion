'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ContactDTO } from '../db';
import { CreateContactModal } from './create-contact-modal';
import { EditContactModal } from './edit-contact-modal';
import { DeleteContactModal } from './delete-contact-modal';

// ─── Modal state ──────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; item: ContactDTO }
  | { type: 'delete'; item: ContactDTO };

// ─── Channel badge ────────────────────────────────────────────────────────────

const VALUE_TYPE_STYLES: Record<string, string> = {
  EMAIL: 'bg-violet-100 text-violet-700 border-violet-200',
  PHONE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  URL: 'bg-sky-100 text-sky-700 border-sky-200',
};

function ChannelBadge({ valueType }: { valueType: string }) {
  const className =
    VALUE_TYPE_STYLES[valueType] ??
    'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <Badge variant="outline" className={className}>
      {valueType}
    </Badge>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContactClientProps {
  slug: string;
  contacts: ContactDTO[];
  canWrite: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ContactClient({
  canWrite,
  slug,
  contacts,
}: ContactClientProps) {
  const [modal, setModal] = useState<ModalState>({ type: 'closed' });
  const close = () => setModal({ type: 'closed' });

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Contactos</h2>
          <p className="text-muted-foreground text-sm">
            {contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'}
          </p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => setModal({ type: 'create' })}>
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Nuevo Contacto
          </Button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {contacts.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          Sin contactos. Crea el primero con el botón de arriba.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Canal</TableHead>
                <TableHead className="hidden w-36 sm:table-cell">
                  Tipo
                </TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="hidden w-48 md:table-cell">
                  Nombre
                </TableHead>
                {canWrite && (
                  <TableHead className="w-20 text-right">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  {/* Channel (valueType) */}
                  <TableCell>
                    <ChannelBadge valueType={contact.valueType} />
                  </TableCell>

                  {/* Concern type */}
                  <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                    {contact.concernType}
                  </TableCell>

                  {/* Value — linkified for EMAIL and URL */}
                  <TableCell className="max-w-xs">
                    {contact.valueType === 'EMAIL' ? (
                      <a
                        href={`mailto:${contact.value}`}
                        className="text-primary hover:underline"
                      >
                        {contact.value}
                      </a>
                    ) : contact.valueType === 'PHONE' ? (
                      <a
                        href={contact.value}
                        className="text-primary hover:underline"
                      >
                        {contact.value}
                      </a>
                    ) : (
                      <span className="font-mono text-sm">{contact.value}</span>
                    )}
                  </TableCell>

                  {/* Name */}
                  <TableCell className="text-muted-foreground hidden truncate text-sm md:table-cell">
                    {contact.name ?? <span className="italic">Sin nombre</span>}
                  </TableCell>

                  {/* Actions */}
                  {canWrite && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Editar contacto"
                          onClick={() =>
                            setModal({ type: 'edit', item: contact })
                          }
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive h-8 w-8"
                          aria-label="Eliminar contacto"
                          onClick={() =>
                            setModal({ type: 'delete', item: contact })
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

      {/*
        All three modals always rendered — never conditional.
        The discriminated union makes it structurally impossible to have
        two modals open or to enter edit/delete without a concrete item.
      */}
      <CreateContactModal
        slug={slug}
        open={modal.type === 'create'}
        onOpenChange={(open) => !open && close()}
      />

      <EditContactModal
        slug={slug}
        item={modal.type === 'edit' ? modal.item : null}
        open={modal.type === 'edit'}
        onOpenChange={(open) => !open && close()}
      />

      <DeleteContactModal
        slug={slug}
        item={modal.type === 'delete' ? modal.item : null}
        open={modal.type === 'delete'}
        onOpenChange={(open) => !open && close()}
      />
    </div>
  );
}
