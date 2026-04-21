import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dbGetUniversityBySlug } from '@/features/universities/db';
import { dbGetAgreementById } from '@/features/agreements/db';
import { dbGetAllRefs } from '@/features/refs/db';
import { AgreementForm } from '@/features/agreements/components/agreement-form';

type Props = { params: Promise<{ slug: string; agreementId: string }> };

export default async function EditAgreementPage({ params }: Props) {
  const { slug, agreementId } = await params;

  const [university, agreement, refs] = await Promise.all([
    dbGetUniversityBySlug(slug),
    dbGetAgreementById(agreementId),
    dbGetAllRefs(),
  ]);

  if (!university || !agreement) notFound();
  if (agreement.universityId !== university.id) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar convenio</CardTitle>
          <CardDescription>
            Convenio de tipo{' '}
            <span className="font-medium">{agreement.type?.name}</span> con{' '}
            <span className="font-medium">{university.name}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgreementForm
            mode="edit"
            refs={refs}
            backHref={`/universities/${slug}`}
            universityId={university.id}
            universitySlug={slug}
            agreementId={agreementId}
            defaultValues={{
              typeId: agreement.typeId.toString(),
              statusId: agreement.statusId.toString(),
              spots: agreement.spots?.toString() ?? '',
              link_convenio: agreement.link_convenio ?? '',
              attrIds: agreement.attrs.map((a) => a.attrId),
              beneficiaryIds: agreement.beneficiaries.map(
                (b) => b.beneficiaryId
              ),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
