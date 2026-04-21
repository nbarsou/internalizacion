'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { actionCreateRef } from '@/features/refs/actions';
import type { RefTableName } from '@/features/refs/ref-strategies';

// ── Field config ──────────────────────────────────────────────────────────────

export type CreateFields =
  | { type: 'name' }
  | { type: 'value'; hasColor: boolean }
  | { type: 'beneficiary' };

interface CreateRefDialogProps {
  table: RefTableName;
  fields: CreateFields;
  title: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateRefDialog({
  table,
  fields,
  title,
}: CreateRefDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [cve, setCve] = useState('');
  const [color, setColor] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName('');
    setValue('');
    setCve('');
    setColor('');
    setError('');
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    setOpen(v);
  }

  const isValid = (() => {
    if (fields.type === 'name') return name.trim().length > 0;
    if (fields.type === 'value') return value.trim().length > 0;
    if (fields.type === 'beneficiary')
      return name.trim().length > 0 && cve.trim().length > 0;
    return false;
  })();

  function handleCreate() {
    if (!isValid) return;
    setError('');

    const payload: Record<string, string> = {};
    if (fields.type === 'name') payload.name = name.trim();
    if (fields.type === 'value') {
      payload.value = value.trim();
      if (color.trim()) payload.color = color.trim();
    }
    if (fields.type === 'beneficiary') {
      payload.cve = cve.trim();
      payload.name = name.trim();
    }

    startTransition(async () => {
      const result = await actionCreateRef(table, payload);
      if (result.success) {
        reset();
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-8 gap-1 bg-orange-600 text-white hover:bg-orange-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Agregar a {title}</DialogTitle>
          <DialogDescription>
            El nuevo valor estará disponible de inmediato en todos los
            formularios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {fields.type === 'name' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cr-name">Nombre</Label>
              <Input
                id="cr-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nuevo valor…"
                autoFocus
              />
            </div>
          )}

          {fields.type === 'value' && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cr-value">Valor</Label>
                <Input
                  id="cr-value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Nuevo valor…"
                  autoFocus
                />
              </div>
              {fields.hasColor && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cr-color">
                    Color{' '}
                    <span className="text-muted-foreground font-normal">
                      (opcional, hex)
                    </span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cr-color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#22c55e"
                      className="font-mono"
                    />
                    {color && (
                      <span
                        className="h-8 w-8 shrink-0 rounded-md border"
                        style={{ backgroundColor: color }}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {fields.type === 'beneficiary' && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cr-cve">CVE</Label>
                <Input
                  id="cr-cve"
                  value={cve}
                  onChange={(e) => setCve(e.target.value)}
                  placeholder="CC"
                  className="font-mono uppercase"
                  maxLength={10}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cr-name-b">Descripción</Label>
                <Input
                  id="cr-name-b"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ciencias de la Comunicación"
                />
              </div>
            </>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!isValid || isPending}
            onClick={handleCreate}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isPending ? 'Guardando…' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
