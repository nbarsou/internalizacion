import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Globe,
  MapPin,
  FileText,
  Building2,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { dbGetUniversityBySlug } from '@/features/universities/db';
import {
  dbGetAgreementsByUniversity,
  redactAgreements,
} from '@/features/agreements/db';
import { dbGetObservationsByUniversity } from '@/features/observations/db';
import { dbGetAllRefs } from '@/features/refs/db';
import { AgreementsClient } from '@/features/agreements/components/agreements-client';
import { ObservationClient } from '@/features/observations/components/client-observation';
import { ContactClient } from '@/features/contacts/components/contacts-client';
import { requirePermission } from '@/lib/authz';
import { UniversityHeaderActions } from '@/features/universities/components/university-header-actions';

type Props = { params: Promise<{ slug: string }> };

export default async function UniversityDetailPage({ params }: Props) {
  const { can } = await requirePermission('read:university');

  const { slug } = await params;

  const university = await dbGetUniversityBySlug(slug);
  if (!university) notFound();

  const [rawAgreements, observations, refs] = await Promise.all([
    dbGetAgreementsByUniversity(university.id),
    dbGetObservationsByUniversity(university.id),
    dbGetAllRefs(),
  ]);

  const agreements = redactAgreements(rawAgreements, can['write:agreement']);
  const universityObs = observations.filter((o) => o.agreementId === null);

  // Build location string: "Ciudad, País — Región"
  const locationParts = [university.city, university.country.value]
    .filter(Boolean)
    .join(', ');
  const locationWithRegion = university.region?.value
    ? `${locationParts} — ${university.region.value}`
    : locationParts;

  return (
    <div className="flex flex-col gap-4">
      {/* Back navigation */}
      <Button variant="ghost" size="sm" className="w-fit gap-1 pl-0" asChild>
        <Link href="/universities">
          <ArrowLeft className="h-4 w-4" />
          Todas las instituciones
        </Link>
      </Button>

      <Card>
        {/* ── Header: university identity + actions ── */}
        <CardHeader className="flex w-full flex-col gap-5 pb-6">
          {/* ── Row 1: Title, Subtitle & Actions ── */}
          <div className="flex w-full items-start justify-between gap-6">
            {/* Main Info Group */}
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-foreground text-2xl leading-none font-bold tracking-tight">
                  {university.name}
                </h1>
                {university.isCatholic && (
                  <Badge variant="secondary" className="font-medium">
                    ✝ Católica
                  </Badge>
                )}
              </div>

              {/* Subtitle Row: Location & Website */}
              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                {locationWithRegion && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="truncate">{locationWithRegion}</span>
                  </span>
                )}

                {university.web_page && (
                  <a
                    href={university.web_page}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary flex items-center gap-1.5 transition-colors hover:underline"
                  >
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{university.web_page}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            {can['write:university'] && (
              <div className="ml-auto flex shrink-0 items-start">
                <UniversityHeaderActions university={university} slug={slug} />
              </div>
            )}
          </div>

          {/* ── Row 2: Standard Shadcn Badges with Colored Icons ── */}
          <div className="flex flex-wrap items-center gap-2.5">
            {university.institutionType && (
              <Badge
                variant="outline"
                className="text-muted-foreground flex items-center gap-1.5 font-normal"
              >
                <Building2 className="h-3.5 w-3.5 text-violet-500" />
                {university.institutionType.value}
              </Badge>
            )}

            {university.campus && (
              <Badge
                variant="outline"
                className="text-muted-foreground flex items-center gap-1.5 font-normal"
              >
                <GraduationCap className="h-3.5 w-3.5 text-amber-500" />
                {university.campus.value}
              </Badge>
            )}

            {university.utilization && (
              <Badge
                variant="outline"
                className="text-muted-foreground flex items-center gap-1.5 font-normal"
              >
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                {university.utilization.value}
              </Badge>
            )}

            <Badge
              variant="outline"
              className="text-muted-foreground flex items-center gap-1.5 font-normal"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              {university._count.agreements} Convenios
            </Badge>
          </div>
        </CardHeader>

        {/* ── Content: feature sections ── */}
        <CardContent className="flex flex-col gap-y-6 pt-0">
          <Separator className="mb-6" />

          <ContactClient
            slug={university.slug}
            contacts={university.contacts}
            canWrite={can['write:contact']}
          />

          <Separator className="my-6" />

          <ObservationClient
            slug={university.slug}
            observations={universityObs}
            context="university"
            canWrite={can['write:observation']}
          />

          <Separator className="my-6" />

          <AgreementsClient
            universityId={university.id}
            universitySlug={slug}
            agreements={agreements}
            refs={refs}
            canWrite={can['write:agreement']}
          />
        </CardContent>
      </Card>
    </div>
  );
}
