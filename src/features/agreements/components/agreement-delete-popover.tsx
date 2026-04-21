'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { actionDeleteAgreement } from '../actions';

interface DeleteAgreementPopoverProps {
  id: string;
  universityId: string;
  typeName: string;
  onDone: () => void;
}

export function DeleteAgreementPopover({
  id,
  universityId,
  typeName,
  onDone,
}: DeleteAgreementPopoverProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setLoading(true);
    const result = await actionDeleteAgreement(id, universityId);
    setLoading(false);
    if (result.success) {
      setOpen(false);
      onDone();
    } else {
      setError(result.formError ?? 'Error al eliminar');
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive h-7 w-7"
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium">¿Archivar convenio?</p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {typeName}
        </p>
        {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-7 text-xs"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Archivando…' : 'Archivar'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
