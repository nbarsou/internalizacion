// app/(protected)/dashboard/page.tsx
import {
  DonutChartSkeleton,
  AreaChartSkeleton,
  BarChartSkeleton,
} from '@/components/charts';
import { AgreementTypeChart } from '@/features/dashboard/components/agreement-type-chart';
import { AgreementsChart } from '@/features/dashboard/components/agreements-chart';
import { CountryChart } from '@/features/dashboard/components/country-chart';
import { ExpiringAgreementsChart } from '@/features/dashboard/components/expiring-chart';
import { FacultyChart } from '@/features/dashboard/components/faculty-chart';
import { GrowthChart } from '@/features/dashboard/components/growth-chart';
import { UniversityMapSkeleton } from '@/features/dashboard/components/map/university-map-skeleton';
import { DashboardMap } from '@/features/dashboard/components/map/univesity-map-card';
import { Suspense } from 'react';
import { requirePermission } from '@/lib/authz';

export default async function DashboardPage() {
  const { can } = await requirePermission('read:university'); // or whatever gate you use

  return (
    <div className="space-y-4">
      <Suspense fallback={<UniversityMapSkeleton />}>
        <DashboardMap />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/*
         * ADMIN ONLY — expiring agreements needs attention from staff only.
         * Its presence/absence changes the grid: when it's here the two rows
         * fill evenly (3 + 3). When it's absent GrowthChart spans 2 columns
         * so the bottom row stays full (3 + 2-wide + 1).
         */}
        {can['read:sensitive'] && (
          <Suspense fallback={<DonutChartSkeleton />}>
            <ExpiringAgreementsChart />
          </Suspense>
        )}

        <Suspense fallback={<BarChartSkeleton />}>
          <FacultyChart />
        </Suspense>

        <Suspense fallback={<DonutChartSkeleton />}>
          <AgreementTypeChart />
        </Suspense>

        <Suspense fallback={<DonutChartSkeleton />}>
          <AgreementsChart />
        </Suspense>

        {/* Wrapper carries the span — no changes needed inside GrowthChart */}
        <div className={!can['read:sensitive'] ? 'lg:col-span-2' : undefined}>
          <Suspense fallback={<AreaChartSkeleton />}>
            <GrowthChart />
          </Suspense>
        </div>

        <Suspense fallback={<BarChartSkeleton />}>
          <CountryChart />
        </Suspense>
      </div>
    </div>
  );
}
