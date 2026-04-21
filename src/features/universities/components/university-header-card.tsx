'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { UniversityDisplay } from './university-display';
import { UniversityEditForm } from './university-edit-form';
import { DeleteUniversityDialog } from './university-delete-form';
import type { UniversityDetail } from '@/features/universities/db';
import type { AllRefs } from '@/features/refs/db';

interface UniversityHeaderCardProps {
  university: UniversityDetail;
  refs: AllRefs;
}

export function UniversityHeaderCard({
  university,
  refs,
}: UniversityHeaderCardProps) {
  const [editing, setEditing] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="min-w-0 flex-1">
          {/* Title shown only in display mode — edit form has its own FieldLegend */}
          {!editing && (
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Institución partner
            </p>
          )}
        </div>

        {!editing && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
            <DeleteUniversityDialog id={university.id} name={university.name} />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {editing ? (
          <UniversityEditForm
            university={university}
            refs={refs}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <UniversityDisplay university={university} />
        )}
      </CardContent>
    </Card>
  );
}
