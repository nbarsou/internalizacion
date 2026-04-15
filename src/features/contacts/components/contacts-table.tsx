import { Mail, Phone, Plus } from 'lucide-react';
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
import { dbGetContactsByUniversity } from '@/features/contacts/db';

// ── Label maps — string literals only, no Prisma enum values ─────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function ContactValue({
  valueType,
  value,
}: {
  valueType: string;
  value: string;
}) {
  const config = VALUE_CONFIG[valueType];

  if (valueType === 'EMAIL') {
    return (
      <a
        href={`mailto:${value}`}
        className="flex items-center gap-1.5 text-blue-600 hover:underline"
      >
        {config?.icon}
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
        {config?.icon}
        {value}
      </a>
    );
  }

  return <span>{value}</span>;
}

// ── Main component ────────────────────────────────────────────────────────────

interface ContactsTableProps {
  universityId: string;
  universityName: string;
}

export async function ContactsTable({
  universityId,
  universityName,
}: ContactsTableProps) {
  const contacts = await dbGetContactsByUniversity(universityId);

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
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only">Agregar contacto</span>
        </Button>
      </CardHeader>

      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-sm">
            <p>No hay contactos registrados para esta institución.</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => {
                  const concern = CONCERN_CONFIG[contact.concernType] ?? {
                    label: contact.concernType,
                    className: 'bg-slate-100 text-slate-600',
                  };
                  const valueLabel =
                    VALUE_CONFIG[contact.valueType]?.label ?? contact.valueType;

                  return (
                    <TableRow key={contact.id}>
                      {/* Name (optional) */}
                      <TableCell>
                        {contact.name ? (
                          <span className="font-medium">{contact.name}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>

                      {/* Concern type: INCOMING / OUTGOING / GENERAL */}
                      <TableCell>
                        <Badge variant="outline" className={concern.className}>
                          {concern.label}
                        </Badge>
                      </TableCell>

                      {/* Value type: EMAIL / PHONE */}
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {valueLabel}
                        </span>
                      </TableCell>

                      {/* Clickable value */}
                      <TableCell>
                        <ContactValue
                          valueType={contact.valueType}
                          value={contact.value}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
