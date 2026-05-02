'use client';

// features/invites/components/invite-section.tsx
import { useOptimistic, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InviteForm } from './create-invite-form';
import { deleteInviteAction } from '../actions';
import { ROLE_LABELS } from '@/lib/enums';
import type { PendingInvite } from '../db';

interface InviteManagementProps {
  pendingInvites: PendingInvite[];
  actingIsSuperuser: boolean;
  canWrite: boolean;
}

export function InviteManagement({
  pendingInvites,
  actingIsSuperuser,
  canWrite,
}: InviteManagementProps) {
  // Optimistically remove deleted invites from the list
  const [optimisticInvites, removeOptimistic] = useOptimistic(
    pendingInvites,
    (current, idToRemove: string) => current.filter((i) => i.id !== idToRemove)
  );
  const [isPending, startTransition] = useTransition();

  // TODO: Issue with error handling, if action fails we diplay optimistic data
  // until next fetch.
  async function handleDelete(id: string) {
    startTransition(async () => {
      removeOptimistic(id);
      const result = await deleteInviteAction(id);
      if (result?.type === 'error') {
        toast.error(result.message);
      } else if (result?.type === 'success') {
        toast.success(result.message);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitaciones</CardTitle>
        <CardDescription className="text-xs">
          Agrega personas al sistema, y administra invitaciones. Registra una
          invitación pendiente. El acceso se activa en el primer inicio de
          sesión.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {canWrite && <InviteForm actingIsSuperuser={actingIsSuperuser} />}

        {/* ── Pending list ──────────────────────────────────── */}
        {optimisticInvites.length > 0 && (
          <div className="mt-4 divide-y rounded-lg border">
            {optimisticInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{invite.email}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Invitado por {invite.creator.name}
                    {invite.expiresAt && (
                      <>
                        {' · '}vence el{' '}
                        {format(invite.expiresAt, 'PPP', { locale: es })}
                      </>
                    )}
                  </p>
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-2">
                  <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-medium">
                    {ROLE_LABELS[invite.role]}
                  </span>

                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      className="text-muted-foreground hover:text-destructive h-7 w-7"
                      onClick={() => handleDelete(invite.id)}
                      aria-label={`Eliminar invitación para ${invite.email}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
