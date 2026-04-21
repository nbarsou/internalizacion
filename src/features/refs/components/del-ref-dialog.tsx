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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { actionDeleteRef } from '@/features/refs/actions';
import type { RefTableName } from '@/features/refs/ref-strategies';

interface DeleteRefDialogProps {
  table: RefTableName;
  id: number;
  name: string;
  usedCount: number;
  usedByLabel: string;
}

export function DeleteRefDialog({
  table,
  id,
  name,
  usedCount,
  usedByLabel,
}: DeleteRefDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const isBlocked = usedCount > 0;

  function handleDelete() {
    setError('');
    startTransition(async () => {
      const result = await actionDeleteRef(table, id);
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  const triggerBtn = (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive hover:text-destructive h-7 w-7"
      disabled={isBlocked}
      onClick={isBlocked ? undefined : () => setOpen(true)}
    >
      <Trash2 className="h-3.5 w-3.5" />
      <span className="sr-only">Eliminar</span>
    </Button>
  );

  return (
    <>
      {isBlocked ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{triggerBtn}</span>
            </TooltipTrigger>
            <TooltipContent>
              No se puede eliminar: usado por {usedCount} {usedByLabel}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        triggerBtn
      )}

      <AlertDialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setError('');
          setOpen(v);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar valor de referencia</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar{' '}
              <span className="font-semibold">&quot;{name}&quot;</span>? Esta
              acción es permanente.
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
              {isPending ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
