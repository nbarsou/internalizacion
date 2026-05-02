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
import { deleteAgreementAction } from '../actions';
import type { AgreementsByUniversityDTO } from '../db';

// ------------------------------------------------------------------
// 1. MODAL WRAPPER (Handles UI and AlertDialog state)
// ------------------------------------------------------------------

interface DeleteAgreementModalProps {
  universitySlug: string;
  item: AgreementsByUniversityDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAgreementModal({
  universitySlug,
  item,
  open,
  onOpenChange,
}: DeleteAgreementModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Convenio</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>¿Estás seguro de que deseas eliminar este convenio?</p>
              <p className="text-destructive text-xs">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Only render the content when the item exists! */}
        {item && (
          <DeleteAgreementContent
            universitySlug={universitySlug}
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

interface DeleteAgreementContentProps {
  universitySlug: string;
  item: AgreementsByUniversityDTO; // 👈 NO NULL!
  onSuccess: () => void;
  onCancel: () => void;
}

function DeleteAgreementContent({
  universitySlug,
  item,
  onSuccess,
  onCancel,
}: DeleteAgreementContentProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      // We don't need `if (!item?.id)` anymore because item is guaranteed!
      const result = await deleteAgreementAction(item.id, universitySlug);

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
        <p className="text-foreground font-medium">{item.type.value}</p>
        <p className="text-muted-foreground">Estado: {item.status.value}</p>
      </div>

      <AlertDialogFooter className="mt-6">
        <AlertDialogCancel onClick={onCancel} disabled={isPending}>
          Cancelar
        </AlertDialogCancel>

        <AlertDialogAction
          disabled={isPending}
          // 👇 In standard Shadcn UI, AlertDialogAction doesn't have a "variant" prop,
          // so we use Tailwind classes to make it look destructive (red).
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={(e) => {
            // 👇 Crucial: Prevents the modal from instantly closing so the user can see the spinner
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
