'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Trash2Icon } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { actionDeleteRef } from '../actions';
import { type RefTableName } from '../schemas';
import type { RefItem } from './edit-ref-modal';

interface DeleteRefModalProps {
  item: RefItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: RefTableName;
  title: string;
}

export function DeleteRefModal({
  item,
  open,
  onOpenChange,
  table,
  title,
}: DeleteRefModalProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(event: React.MouseEvent) {
    event.preventDefault(); // Prevents AlertDialogAction's auto-close
    if (!item) return;

    startTransition(async () => {
      const result = await actionDeleteRef(item.id, table);

      if (result?.type === 'success') {
        toast.success(result.message);
        onOpenChange(false);
      } else if (result?.type === 'error') {
        toast.error(result.message);
        onOpenChange(false); // Closes on error too, matching your provided pattern
      }
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return; // Block closing if a transition is currently pending
        onOpenChange(next);
      }}
    >
      {/* Note: We omit <AlertDialogTrigger> here because the trigger 
        is handled by the 'Eliminar' button in the parent component's list. 
      */}
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>¿Eliminar de {title}?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar{' '}
            <span className="text-foreground font-medium">{item?.value}</span>?
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
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
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
