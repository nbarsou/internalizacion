// src/features/refs/components/delete-beneficiary-modal.tsx
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
import { actionDeleteBeneficiary } from '../actions';
import type { BeneficiaryRow } from './beneficiary-table';

interface DeleteBeneficiaryModalProps {
  item: BeneficiaryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
}

export function DeleteBeneficiaryModal({
  item,
  open,
  onOpenChange,
  title,
}: DeleteBeneficiaryModalProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(event: React.MouseEvent) {
    event.preventDefault(); // Prevents AlertDialogAction's auto-close
    if (!item) return;

    startTransition(async () => {
      const result = await actionDeleteBeneficiary(item.id);

      if (result?.type === 'success') {
        toast.success(result.message);
        onOpenChange(false);
      } else if (result?.type === 'error') {
        toast.error(result.message);
        onOpenChange(false);
      }
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return; // Block close during transition
        onOpenChange(next);
      }}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>¿Eliminar de {title}?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar{' '}
            <span className="text-foreground font-medium">{item?.value}</span>{' '}
            <span className="text-muted-foreground">({item?.cve})</span>? Esta
            acción no se puede deshacer.
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
