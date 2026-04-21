'use client';

import { useState } from 'react';
import { Mail, Phone, Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ContactFormRow } from './contact-form-row';
import {
  actionCreateContact,
  actionUpdateContact,
  actionDeleteContact,
} from '../actions';
import type { ContactFormValues } from '../schemas';

// ── Label maps ────────────────────────────────────────────────────────────────

const CONCERN_CONFIG: Record<string, { label: string; className: string }> = {
  INCOMING: {
    label: 'Entrante',
    className: 'bg-blue-100   text-blue-700   border-blue-200',
  },
  OUTGOING: {
    label: 'Saliente',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  GENERAL: {
    label: 'General',
    className: 'bg-slate-100  text-slate-600  border-slate-200',
  },
};

const VALUE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  EMAIL: { label: 'Correo', icon: <Mail className="h-3.5 w-3.5" /> },
  PHONE: { label: 'Teléfono', icon: <Phone className="h-3.5 w-3.5" /> },
};

// ── Contact type ──────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  universityId: string;
  name: string | null;
  concernType: string;
  valueType: string;
  value: string;
}

// ── Clickable contact value ───────────────────────────────────────────────────

function ContactValue({
  valueType,
  value,
}: {
  valueType: string;
  value: string;
}) {
  if (valueType === 'EMAIL') {
    return (
      <a
        href={`mailto:${value}`}
        className="flex items-center gap-1.5 text-blue-600 hover:underline"
      >
        {VALUE_CONFIG.EMAIL.icon}
        {value}
      </a>
    );
  }
  if (valueType === 'PHONE') {
    return (
      <a
        href={`tel:${value}`}
        className="text-muted-foreground flex items-center gap-1.5 hover:underline"
      >
        {VALUE_CONFIG.PHONE.icon}
        {value}
      </a>
    );
  }
  return <span>{value}</span>;
}

// ── Delete popover ────────────────────────────────────────────────────────────

function DeleteContactPopover({
  id,
  universityId,
  value,
  onDone,
}: {
  id: string;
  universityId: string;
  value: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setLoading(true);
    const result = await actionDeleteContact(id, universityId);
    setLoading(false);
    if (result.success) {
      setOpen(false);
      onDone();
    } else {
      setError(result.formError ?? 'Error al eliminar');
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive h-7 w-7"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3">
        <p className="text-sm font-medium">¿Eliminar contacto?</p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">{value}</p>
        {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-7 text-xs"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ContactsTableClientProps {
  universityId: string;
  universityName: string;
  initialContacts: Contact[];
}

export function ContactsTableClient({
  universityId,
  universityName,
  initialContacts,
}: ContactsTableClientProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // ── Optimistic helpers ──────────────────────────────────────────────────────

  function refreshFromServer() {
    // After a mutation revalidatePath fires — router.refresh() would trigger
    // a server re-render. Since ContactsTable is a server component wrapper,
    // we trigger a full refresh via window reload as a safe fallback.
    // In production you'd use router.refresh() from useRouter.
    window.location.reload();
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleCreate(values: ContactFormValues) {
    const result = await actionCreateContact(universityId, values);
    if (result.success) {
      setShowCreate(false);
      refreshFromServer();
    }
    return result;
  }

  async function handleUpdate(id: string, values: ContactFormValues) {
    const result = await actionUpdateContact(id, universityId, values);
    if (result.success) {
      setEditingId(null);
      refreshFromServer();
    }
    return result;
  }

  async function handleDelete(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  const COLS = 5; // name, concern, valueType, value, actions

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Contactos</CardTitle>
          <CardDescription>
            Contactos de intercambio registrados para {universityName}.
          </CardDescription>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1 bg-orange-600 text-white hover:bg-orange-700"
          onClick={() => {
            setShowCreate(true);
            setEditingId(null);
          }}
          disabled={showCreate}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only">Agregar contacto</span>
        </Button>
      </CardHeader>

      <CardContent>
        {contacts.length === 0 && !showCreate ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-sm">
            <p>No hay contactos registrados para esta institución.</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-1 gap-1"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar primer contacto
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="w-20 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => {
                  const concern = CONCERN_CONFIG[contact.concernType] ?? {
                    label: contact.concernType,
                    className: 'bg-slate-100 text-slate-600',
                  };

                  // Edit mode — replace row with form
                  if (editingId === contact.id) {
                    return (
                      <ContactFormRow
                        key={contact.id}
                        defaultValues={{
                          name: contact.name ?? '',
                          concernType: contact.concernType,
                          valueType: contact.valueType,
                          value: contact.value,
                        }}
                        onSubmit={(values) => handleUpdate(contact.id, values)}
                        onCancel={() => setEditingId(null)}
                      />
                    );
                  }

                  // Display mode
                  return (
                    <TableRow key={contact.id}>
                      <TableCell>
                        {contact.name ? (
                          <span className="font-medium">{contact.name}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={concern.className}>
                          {concern.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {VALUE_CONFIG[contact.valueType]?.label ??
                            contact.valueType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ContactValue
                          valueType={contact.valueType}
                          value={contact.value}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingId(contact.id);
                              setShowCreate(false);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <DeleteContactPopover
                            id={contact.id}
                            universityId={universityId}
                            value={contact.value}
                            onDone={() => handleDelete(contact.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Create row — appended at bottom when active */}
                {showCreate && (
                  <ContactFormRow
                    onSubmit={handleCreate}
                    onCancel={() => setShowCreate(false)}
                  />
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
