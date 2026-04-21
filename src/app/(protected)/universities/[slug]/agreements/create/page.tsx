import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dbGetUniversityBySlug } from '@/features/universities/db';
import { dbGetAllRefs } from '@/features/refs/db';
import { AgreementForm } from '@/features/agreements/components/agreement-form';

type Props = { params: Promise<{ slug: string }> };

export default async function CreateAgreementPage({ params }: Props) {
  const { slug } = await params;

  const [university, refs] = await Promise.all([
    dbGetUniversityBySlug(slug),
    dbGetAllRefs(),
  ]);

  if (!university) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo convenio</CardTitle>
          <CardDescription>
            Registrar un nuevo convenio para{' '}
            <span className="font-medium">{university.name}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgreementForm
            mode="create"
            refs={refs}
            backHref={`/universities/${slug}`}
            universityId={university.id}
            universitySlug={slug}
          />
        </CardContent>
      </Card>
    </div>
  );
}
