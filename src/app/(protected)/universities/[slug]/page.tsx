import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dbGetUniversityBySlug } from '@/features/universities/db';
import { dbGetAgreementsByUniversity } from '@/features/agreements/db';
import { dbGetObservationsByUniversity } from '@/features/observations/db';
import { dbGetAllRefs } from '@/features/refs/db';
import { UniversityHeaderCard } from '@/features/universities/components/university-header-card';
import { AgreementsTable } from '@/features/agreements/components/agreements-table';
import { ObservationPanel } from '@/features/observations/components/observation-panel';
import { ContactsTable } from '@/features/contacts/components/contacts-table';

type Props = { params: Promise<{ slug: string }> };

export default async function UniversityAgreementsPage({ params }: Props) {
  const { slug } = await params;

  const university = await dbGetUniversityBySlug(slug);
  if (!university) notFound();

  const [agreements, observations, refs] = await Promise.all([
    dbGetAgreementsByUniversity(university.id),
    dbGetObservationsByUniversity(university.id),
    dbGetAllRefs(),
  ]);

  const universityObs = observations.filter((o) => o.agreementId === null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="gap-1 pl-0" asChild>
          <Link href="/universities">
            <ArrowLeft className="h-4 w-4" />
            Todas las instituciones
          </Link>
        </Button>
      </div>

      <UniversityHeaderCard university={university} refs={refs} />

      <ContactsTable
        universityId={university.id}
        universityName={university.name}
      />

      {universityObs.length > 0 && (
        <ObservationPanel
          observations={universityObs}
          context="university"
          title="Observaciones de la institución"
          maxHeight="200px"
        />
      )}

      <AgreementsTable
        universityId={university.id}
        universitySlug={slug}
        universityName={university.name}
        agreements={agreements}
        observations={observations}
      />
    </div>
  );
}
