'use client';

import { useState, useTransition } from 'react';
import { Pencil } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { actionUpdateRef } from '@/features/refs/actions';
import type { RefTableName } from '@/features/refs/ref-strategies';

interface EditRefDialogProps {
  table: RefTableName;
  id: number;
  currentName: string;
  field?: 'name' | 'value';
}

export function EditRefDialog({
  table,
  id,
  currentName,
  field = 'name',
}: EditRefDialogProps) {
  const [open, setOpen] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const isValid = newValue.trim().length > 0 && confirm === newValue.trim();

  function handleOpenChange(v: boolean) {
    if (!v) {
      setNewValue('');
      setConfirm('');
      setError('');
    }
    setOpen(v);
  }

  function handleConfirm() {
    if (!isValid) return;
    setError('');
    const payload = { [field]: newValue.trim() };
    startTransition(async () => {
      const result = await actionUpdateRef(table, id, payload);
      if (result.success) {
        handleOpenChange(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Pencil className="h-3.5 w-3.5" />
          <span className="sr-only">Editar</span>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Renombrar valor de referencia</AlertDialogTitle>
          <AlertDialogDescription>
            Este cambio afecta a todos los registros que usan{' '}
            <span className="font-semibold">&quot;{currentName}&quot;</span>. No
            hay vuelta atrás sin editar cada registro individualmente.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-new">
              Nuevo {field === 'name' ? 'nombre' : 'valor'}
            </Label>
            <Input
              id="edit-new"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={currentName}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-confirm">
              Escribe{' '}
              <span className="font-semibold">{newValue.trim() || '…'}</span>{' '}
              para confirmar
            </Label>
            <Input
              id="edit-confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmar nuevo valor"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!isValid || isPending}
            onClick={handleConfirm}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isPending ? 'Guardando…' : 'Confirmar cambio'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
