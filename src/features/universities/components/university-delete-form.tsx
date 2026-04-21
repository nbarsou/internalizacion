'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { actionDeleteUniversity } from '../actions';

interface DeleteUniversityDialogProps {
  id: string;
  name: string;
}

export function DeleteUniversityDialog({
  id,
  name,
}: DeleteUniversityDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError('');
    startTransition(async () => {
      try {
        await actionDeleteUniversity(id);
        // redirect happens server-side
      } catch {
        setError('No se pudo eliminar la institución. Intenta de nuevo.');
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive h-8 gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar institución</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Eliminar <span className="font-semibold">&quot;{name}&quot;</span>?
            Esta acción desactivará la institución y todos sus convenios
            asociados. No se borrará permanentemente pero dejará de aparecer en
            el sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-destructive px-6 text-sm">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Eliminando…' : 'Sí, eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
