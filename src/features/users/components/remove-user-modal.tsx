'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { removeUserAction } from '../actions';
import type { AdminUser } from '../db';

interface RemoveUserModalProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemoveUserModal({
  user,
  open,
  onOpenChange,
}: RemoveUserModalProps) {
  // Delete modals use useTransition — no form fields, no FormData,
  // no persistent state that can go stale.
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    if (!user) return;
    startTransition(async () => {
      const result = await removeUserAction(user.id);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar acceso</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar el acceso de{' '}
            <span className="text-foreground font-medium">{user?.name}</span>?
            El usuario será movido a la lista de espera y su sesión activa será
            cerrada.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar acceso'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
