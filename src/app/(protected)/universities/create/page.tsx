import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dbGetAllRefs } from '@/features/refs/db';
import { CreateUniversityForm } from '@/features/universities/components/create-university-form';
import { requirePermission } from '@/lib/authz';

export default async function CreateUniversityPage() {
  await requirePermission('write:university');

  const refs = await dbGetAllRefs();

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div>
        <Button variant="ghost" size="sm" className="gap-1 pl-0" asChild>
          <Link href="/universities">
            <ArrowLeft className="h-4 w-4" />
            Todas las instituciones
          </Link>
        </Button>
      </div>

      <CreateUniversityForm refs={refs} />
    </div>
  );
}
