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
import { deleteObservationAction } from '../actions';
import { ObservationDTO } from '../db';

interface DeleteObservationModalProps {
  slug: string;
  /** Null when the modal is closed — never conditionally unmounted */
  item: ObservationDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteObservationModal({
  slug,
  item,
  open,
  onOpenChange,
}: DeleteObservationModalProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!item) return;
    startTransition(async () => {
      const result = await deleteObservationAction(item.id, slug);
      if (result?.type === 'success') {
        toast.success(result.message);
        onOpenChange(false);
      } else if (result?.type === 'error') {
        toast.error(result.message);
      }
    });
  }

  // Show a truncated preview so the user knows what they're deleting
  const preview =
    item && item.text.length > 80 ? item.text.slice(0, 80) + '…' : item?.text;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar Observación</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>¿Estás seguro de que deseas eliminar esta observación?</p>
              {preview && (
                <p className="text-foreground bg-muted rounded-md px-3 py-2 text-sm leading-snug font-medium">
                  &quot;{preview}&quot;
                </p>
              )}
              <p className="text-destructive text-xs">
                Esta acción no se puede deshacer.
              </p>
            </div>
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
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" /> Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
