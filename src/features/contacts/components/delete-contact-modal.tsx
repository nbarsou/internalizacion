'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { deleteContactAction } from '../actions';
import type { ContactDTO } from '../db';

// ------------------------------------------------------------------
// 1. MODAL WRAPPER (Handles UI and AlertDialog state)
// ------------------------------------------------------------------

interface DeleteContactModalProps {
  slug: string;
  item: ContactDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteContactModal({
  slug,
  item,
  open,
  onOpenChange,
}: DeleteContactModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Contacto</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>¿Estás seguro de que deseas eliminar este contacto?</p>
              <p className="text-destructive text-xs">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Only render the content when the item exists! */}
        {item && (
          <DeleteContactContent
            slug={slug}
            item={item}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ------------------------------------------------------------------
// 2. INNER CONTENT (Handles deletion logic securely)
// ------------------------------------------------------------------

interface DeleteContactContentProps {
  slug: string;
  item: ContactDTO; // 👈 NO NULL!
  onSuccess: () => void;
  onCancel: () => void;
}

function DeleteContactContent({
  slug,
  item,
  onSuccess,
  onCancel,
}: DeleteContactContentProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      // We don't need `if (!item)` anymore because item is guaranteed!
      const result = await deleteContactAction(item.id, slug);

      if (result?.type === 'success') {
        toast.success(result.message);
        onSuccess();
      } else if (result?.type === 'error') {
        toast.error(result?.message);
      }
    });
  }

  return (
    <>
      {/* We can safely render the item data without item && checks */}
      <div className="bg-muted mt-4 rounded-md px-3 py-2 text-sm">
        <p className="text-foreground font-medium">
          {item.name ?? item.valueType}
        </p>
        <p className="text-muted-foreground">{item.value}</p>
      </div>

      <AlertDialogFooter className="mt-6">
        <AlertDialogCancel onClick={onCancel} disabled={isPending}>
          Cancelar
        </AlertDialogCancel>

        <AlertDialogAction
          disabled={isPending}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={(e) => {
            e.preventDefault();
            handleDelete();
          }}
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
    </>
  );
}
