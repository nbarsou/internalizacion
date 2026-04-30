import { Accordion } from '@/components/ui/accordion';
import { dbGetAllRefs } from '@/features/refs/db';
import { RefAccordionSection } from '@/features/refs/components/ref-table';
import type {
  NameRow,
  ValueRow,
  BenefRow,
} from '@/features/refs/components/ref-table';
import { requirePermission } from '@/lib/authz';

export default async function RefsPage() {
  const { can } = await requirePermission('user:view');

  const refs = await dbGetAllRefs();

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <Accordion type="multiple" className="flex flex-col gap-2">
        {/* ── University ref tables ── */}
        <RefAccordionSection<NameRow>
          value="regions"
          title="Regiones"
          table="refRegion"
          rows={refs.regions as NameRow[]}
          countKey="universities"
          usedByLabel="universidades"
          createFields={{ type: 'name' }}
          renderLabel={(r) => r.name}
        />

        <RefAccordionSection<NameRow>
          value="countries"
          title="Países"
          table="refCountry"
          rows={refs.countries as NameRow[]}
          countKey="universities"
          usedByLabel="universidades"
          createFields={{ type: 'name' }}
          renderLabel={(r) => r.name}
        />

        <RefAccordionSection<NameRow>
          value="institution-types"
          title="Tipos de institución"
          table="refInstitutionType"
          rows={refs.institutionTypes as NameRow[]}
          countKey="universities"
          usedByLabel="universidades"
          createFields={{ type: 'name' }}
          renderLabel={(r) => r.name}
        />

        <RefAccordionSection<NameRow>
          value="campuses"
          title="Campus Anáhuac"
          table="refCampus"
          rows={refs.campuses as NameRow[]}
          countKey="universities"
          usedByLabel="universidades"
          createFields={{ type: 'name' }}
          renderLabel={(r) => r.name}
        />

        <RefAccordionSection<ValueRow>
          value="utilizations"
          title="Utilización"
          table="refUtilization"
          rows={refs.utilizations as ValueRow[]}
          countKey="universities"
          usedByLabel="universidades"
          editField="value"
          createFields={{ type: 'value', hasColor: true }}
          renderLabel={(r) => r.value}
          extraHeader="Color"
          renderExtra={(r) =>
            r.color ? (
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full border"
                  style={{ backgroundColor: r.color }}
                />
                <span className="font-mono text-xs">{r.color}</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )
          }
        />

        {/* ── Agreement ref tables ── */}
        <RefAccordionSection<NameRow>
          value="agreement-types"
          title="Tipos de convenio"
          table="refAgreementType"
          rows={refs.agreementTypes as NameRow[]}
          countKey="agreements"
          usedByLabel="convenios"
          createFields={{ type: 'name' }}
          renderLabel={(r) => r.name}
        />

        <RefAccordionSection<ValueRow>
          value="statuses"
          title="Estados de convenio"
          table="refStatus"
          rows={refs.statuses as ValueRow[]}
          countKey="agreements"
          usedByLabel="convenios"
          editField="value"
          createFields={{ type: 'value', hasColor: true }}
          renderLabel={(r) => r.value}
          extraHeader="Color"
          renderExtra={(r) =>
            r.color ? (
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full border"
                  style={{ backgroundColor: r.color }}
                />
                <span className="font-mono text-xs">{r.color}</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )
          }
        />

        <RefAccordionSection<NameRow>
          value="attrs"
          title="Acreditaciones"
          table="refAttr"
          rows={refs.attrs as NameRow[]}
          countKey="agreementAttrs"
          usedByLabel="convenios"
          createFields={{ type: 'name' }}
          renderLabel={(r) => r.name}
        />

        <RefAccordionSection<BenefRow>
          value="beneficiaries"
          title="Escuelas beneficiarias"
          table="refBeneficiary"
          rows={refs.beneficiaries as BenefRow[]}
          countKey="agreements"
          usedByLabel="convenios"
          createFields={{ type: 'beneficiary' }}
          renderLabel={(r) => r.name}
          extraHeader="CVE"
          renderExtra={(r) => (
            <span className="font-mono text-sm font-medium">{r.cve}</span>
          )}
        />
      </Accordion>
    </div>
  );
}
