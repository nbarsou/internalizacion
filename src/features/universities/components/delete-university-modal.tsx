'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, MapPin, Building2 } from 'lucide-react'; // Added icons for visual polish
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
import { UniversityDTO } from '../db';
import { deleteUniversityAction } from '../actions';

// ------------------------------------------------------------------
// 1. MODAL WRAPPER (Handles UI and AlertDialog state)
// ------------------------------------------------------------------

interface DeleteUniversityModalProps {
  universitySlug: string; // Unused in this snippet, but kept from your original
  item: UniversityDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAgreementModal({
  item,
  open,
  onOpenChange,
}: DeleteUniversityModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* Slightly wider max-width for a more elegant breathing room */}
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="flex flex-col items-center text-center sm:text-center">
          {/* Prominent warning badge to immediately signal danger */}
          <div className="bg-destructive/10 ring-destructive/5 mb-2 flex h-14 w-14 items-center justify-center rounded-full ring-8">
            <AlertTriangle className="text-destructive h-7 w-7" />
          </div>

          <AlertDialogTitle className="text-xl font-semibold">
            Eliminar Convenio
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="mt-2 space-y-1.5">
              <p className="text-muted-foreground text-base">
                ¿Estás seguro de que deseas eliminar este convenio?
              </p>
              <p className="text-destructive font-medium">
                Esta acción es permanente y no se puede deshacer.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {item && (
          <DeleteUniversityContent
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

interface DeleteUniversityContentProps {
  item: UniversityDTO;
  onSuccess: () => void;
  onCancel: () => void;
}

function DeleteUniversityContent({
  item,
  onSuccess,
  onCancel,
}: DeleteUniversityContentProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUniversityAction(item.id);

      if (result?.type === 'success') {
        toast.success(result.message);
        onSuccess();
      } else if (result?.type === 'error') {
        toast.error(result?.message);
      }
    });
  }

  return (
    <div className="mt-2 flex flex-col gap-6">
      {/* A visually distinct "receipt" of what is being deleted. 
        Using a subtle red background reinforces that this specific item is in danger.
      */}
      <div className="border-destructive/20 bg-destructive/5 flex flex-col gap-3 rounded-lg border p-4">
        {/* Fallback to country/region from your DTO if type/status are missing */}
        <div className="flex items-start gap-3">
          <Building2 className="text-destructive/70 mt-0.5 h-4 w-4" />
          <div>
            <p className="text-foreground font-semibold">
              {item.institutionType?.value || 'Institución'}
            </p>
            <p className="text-muted-foreground text-xs">Tipo de institución</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="text-destructive/70 mt-0.5 h-4 w-4" />
          <div>
            <p className="text-foreground font-medium">
              {item.country.value}{' '}
              {item.region?.value ? `— ${item.region.value}` : ''}
            </p>
            <p className="text-muted-foreground text-xs">Ubicación</p>
          </div>
        </div>
      </div>

      <AlertDialogFooter className="sm:justify-center sm:gap-3">
        <AlertDialogCancel
          onClick={onCancel}
          disabled={isPending}
          className="sm:w-full"
        >
          Cancelar
        </AlertDialogCancel>

        <AlertDialogAction
          disabled={isPending}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-full"
          onClick={(e) => {
            e.preventDefault();
            handleDelete();
          }}
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4" /> Eliminando...
            </span>
          ) : (
            'Sí, eliminar convenio'
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </div>
  );
}
