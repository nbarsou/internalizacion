import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dbGetUniversityBySlug } from '@/features/universities/db';
import { dbGetAgreementsByUniversity } from '@/features/agreements/db';
import { dbGetObservationsByUniversity } from '@/features/observations/db';
import { UniversityHeader } from '@/features/agreements/components/university-header';
import { UniversityStats } from '@/features/agreements/components/university-stats';
import { AgreementsTable } from '@/features/agreements/components/agreements-table';
import { ObservationPanel } from '@/features/observations/components/observation-panel';
import { ContactsTable } from '@/features/contacts/components/contacts-table';

type Props = { params: Promise<{ slug: string }> };

export default async function UniversityAgreementsPage({ params }: Props) {
  const { slug } = await params;

  const university = await dbGetUniversityBySlug(slug);
  if (!university) notFound();

  // Single query — observations for this university cover both university-level
  // and agreement-level entries (agreementId may or may not be set).
  const [agreements, observations] = await Promise.all([
    dbGetAgreementsByUniversity(university.id),
    dbGetObservationsByUniversity(university.id),
  ]);

  // Split: university-level observations have no agreementId.
  // Agreement-level ones are passed to AgreementsTable which groups them per row.
  const universityObs = observations.filter((o) => o.agreementId === null);

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <div>
        <Button variant="ghost" size="sm" className="gap-1 pl-0" asChild>
          <Link href="/universities">
            <ArrowLeft className="h-4 w-4" />
            Todas las instituciones
          </Link>
        </Button>
      </div>

      {/* Header: name, location, type, website, new agreement CTA */}
      <UniversityHeader university={university} />

      {/* Stats: totals, active, pending, spots */}
      <UniversityStats agreements={agreements} />

      <ContactsTable
        universityId={university.id}
        universityName={university.name}
      />

      {/* University-level observations only (no agreementId).
          Hidden entirely when there are none — no empty card noise. */}
      {universityObs.length > 0 && (
        <ObservationPanel
          observations={universityObs}
          context="university"
          title="Observaciones de la institución"
          maxHeight="200px"
        />
      )}
      {/* Agreements table — receives all observations so it can group
          them inline per agreement row. */}
      <AgreementsTable
        universityName={university.name}
        agreements={agreements}
        observations={observations}
      />
    </div>
  );
}
