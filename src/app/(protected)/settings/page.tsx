import { Accordion } from '@/components/ui/accordion';
import { dbGetAllRefs } from '@/features/refs/db';
import { RefTable } from '@/features/refs/components/ref-table';
import type { ValueRow } from '@/features/refs/components/ref-table';

import { BeneficiaryTable } from '@/features/refs/components/beneficiary-table';
import type { BeneficiaryRow } from '@/features/refs/components/beneficiary-table';

import { requirePermission } from '@/lib/authz';

export default async function RefsPage() {
  const { can } = await requirePermission('read:refs');
  const canWrite = can['write:refs'];

  const refs = await dbGetAllRefs();

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <Accordion type="multiple" className="flex flex-col gap-2">
        {/* ── University ref tables ── */}
        <RefTable
          value="regions"
          title="Regiones"
          table="refRegion"
          rows={refs.regions as ValueRow[]}
          countKey="universities"
          usedByLabel="universidades"
          canWrite={canWrite}
        />

        <RefTable
          value="countries"
          title="Países"
          table="refCountry"
          rows={refs.countries as ValueRow[]}
          countKey="universities"
          usedByLabel="universidades"
          canWrite={canWrite}
        />

        <RefTable
          value="institution-types"
          title="Tipos de institución"
          table="refInstitutionType"
          rows={refs.institutionTypes as ValueRow[]}
          countKey="universities"
          usedByLabel="universidades"
          canWrite={canWrite}
        />

        <RefTable
          value="campuses"
          title="Campus Anáhuac"
          table="refCampus"
          rows={refs.campuses as ValueRow[]}
          countKey="universities"
          usedByLabel="universidades"
          canWrite={canWrite}
        />

        <RefTable
          value="utilizations"
          title="Utilización"
          table="refUtilization"
          rows={refs.utilizations as ValueRow[]}
          countKey="universities"
          usedByLabel="universidades"
          canWrite={canWrite}
        />

        {/* ── Agreement ref tables ── */}
        <RefTable
          value="agreement-types"
          title="Tipos de convenio"
          table="refAgreementType"
          rows={refs.agreementTypes as ValueRow[]}
          countKey="agreements"
          usedByLabel="convenios"
          canWrite={canWrite}
        />

        <RefTable
          value="statuses"
          title="Estados de convenio"
          table="refStatus"
          rows={refs.statuses as ValueRow[]}
          countKey="agreements"
          usedByLabel="convenios"
          canWrite={canWrite}
        />

        <RefTable
          value="attrs"
          title="Acreditaciones"
          table="refAttr"
          rows={refs.attrs as ValueRow[]}
          countKey="agreementAttrs"
          usedByLabel="convenios"
          canWrite={canWrite}
        />

        {/* ── Custom Beneficiary Table ── */}
        <BeneficiaryTable
          value="beneficiaries"
          title="Escuelas beneficiarias"
          rows={refs.beneficiaries as BeneficiaryRow[]}
          countKey="agreements"
          canWrite={canWrite}
        />
      </Accordion>
    </div>
  );
}
