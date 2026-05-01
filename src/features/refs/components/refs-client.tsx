'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateRefModal } from './create-ref-modal';
import { EditRefModal, type RefItem } from './edit-ref-modal';
import { DeleteRefModal } from './delete-ref-modal';
import { type RefTableName } from '../schemas';

type ModalState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; item: RefItem }
  | { type: 'delete'; item: RefItem };

interface RefFeatureClientProps {
  table: RefTableName;
  title: string;
  items: RefItem[];
}

export function RefFeatureClient({
  table,
  title,
  items,
}: RefFeatureClientProps) {
  const [modal, setModal] = useState<ModalState>({ type: 'closed' });
  const close = () => setModal({ type: 'closed' });

  return (
    <div>
      <Button onClick={() => setModal({ type: 'create' })}>
        Nuevo {title}
      </Button>

      {/* Item list... */}
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4">
            <span>{item.value}</span>
            <Button
              variant="ghost"
              onClick={() => setModal({ type: 'edit', item })}
            >
              Editar
            </Button>
            <Button
              variant="ghost"
              onClick={() => setModal({ type: 'delete', item })}
            >
              Eliminar
            </Button>
          </li>
        ))}
      </ul>

      <CreateRefModal
        table={table}
        title={title}
        open={modal.type === 'create'}
        onOpenChange={(open) => !open && close()}
      />

      <EditRefModal
        table={table}
        title={title}
        item={modal.type === 'edit' ? modal.item : null}
        open={modal.type === 'edit'}
        onOpenChange={(open) => !open && close()}
      />

      <DeleteRefModal
        table={table}
        title={title}
        item={modal.type === 'delete' ? modal.item : null}
        open={modal.type === 'delete'}
        onOpenChange={(open) => !open && close()}
      />
    </div>
  );
}
