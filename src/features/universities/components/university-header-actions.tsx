'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteAgreementModal } from '@/features/universities/components/delete-university-modal';
import type { UniversityDTO } from '@/features/universities/db';

interface UniversityHeaderActionsProps {
  university: UniversityDTO;
  slug: string;
}

export function UniversityHeaderActions({
  university,
  slug,
}: UniversityHeaderActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button size="sm" variant="outline" asChild>
        <Link href={`/universities/${slug}/edit`}>
          <PencilIcon className="mr-1.5 h-3.5 w-3.5" />
          Editar
        </Link>
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2Icon className="mr-1.5 h-3.5 w-3.5" />
        Eliminar
      </Button>

      <DeleteAgreementModal
        universitySlug={slug}
        item={university}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
