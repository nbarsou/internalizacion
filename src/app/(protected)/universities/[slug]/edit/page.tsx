import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dbGetAllRefs } from '@/features/refs/db';
import { dbGetUniversityBySlug } from '@/features/universities/db';
import { UpdateUniversityForm } from '@/features/universities/components/update-university-form';
import { requirePermission } from '@/lib/authz';

// 1. Update the interface to type params as a Promise
interface EditUniversityPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EditUniversityPage({
  params,
}: EditUniversityPageProps) {
  await requirePermission('write:university');

  // 2. Await the params before destructuring
  const { slug } = await params;

  const [refs, university] = await Promise.all([
    dbGetAllRefs(),
    dbGetUniversityBySlug(slug),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div>
        <Button variant="ghost" size="sm" className="gap-1 pl-0" asChild>
          <Link href={`/universities/${university.slug}`}>
            <ArrowLeft className="h-4 w-4" />
            Volver a {university.name}
          </Link>
        </Button>
      </div>

      <UpdateUniversityForm university={university} refs={refs} />
    </div>
  );
}
