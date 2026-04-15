import { dbGetAllRefs } from '@/features/refs/db';
import { RefTable } from '@/features/refs/components/ref-table';

export default async function RefsPage() {
  const refs = await dbGetAllRefs();

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tablas de Referencia
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Vocabulario controlado utilizado en todo el sistema. Solo lectura.
        </p>
      </div>

      {/* Two-column grid for compact tables, single column for larger ones */}
      <div className="grid gap-4 md:grid-cols-2">
        <RefTable
          title="Regiones"
          description="Clasificación geográfica de universidades."
          rows={refs.regions}
          columns={[{ key: 'name', label: 'Nombre' }]}
        />

        <RefTable
          title="Campus Anáhuac"
          description="Campus titular del convenio."
          rows={refs.campuses}
          columns={[{ key: 'name', label: 'Campus' }]}
        />

        <RefTable
          title="Tipos de institución"
          description="Giro institucional del socio."
          rows={refs.institutionTypes}
          columns={[{ key: 'name', label: 'Tipo' }]}
        />

        <RefTable
          title="Estados de convenio"
          description="Ciclo de vida operacional de un convenio."
          rows={refs.statuses}
          columns={[
            {
              key: 'value',
              label: 'Estado',
              render: (row) => (
                <span className="flex items-center gap-2">
                  {row.color && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full border"
                      style={{ backgroundColor: row.color }}
                    />
                  )}
                  {row.value}
                </span>
              ),
            },
          ]}
        />

        <RefTable
          title="Utilización"
          description="Nivel de uso activo del convenio."
          rows={refs.utilizations}
          columns={[
            {
              key: 'value',
              label: 'Nivel',
              render: (row) => (
                <span className="flex items-center gap-2">
                  {row.color && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full border"
                      style={{ backgroundColor: row.color }}
                    />
                  )}
                  {row.value}
                </span>
              ),
            },
          ]}
        />

        <RefTable
          title="Acreditaciones"
          description="Organismos acreditadores reconocidos."
          rows={refs.attrs}
          columns={[{ key: 'name', label: 'Organismo' }]}
        />
      </div>

      {/* Full-width for larger tables */}
      <RefTable
        title="Países"
        description="Países de origen de las universidades socias."
        rows={refs.countries}
        columns={[{ key: 'name', label: 'País' }]}
      />

      <RefTable
        title="Tipos de convenio"
        description="Modalidades de acuerdo académico disponibles."
        rows={refs.agreementTypes}
        columns={[{ key: 'name', label: 'Tipo' }]}
      />

      <RefTable
        title="Escuelas beneficiarias"
        description="Facultades y escuelas que pueden participar en los convenios."
        rows={refs.beneficiaries}
        columns={[
          { key: 'cve', label: 'CVE' },
          { key: 'name', label: 'Descripción' },
        ]}
      />
    </div>
  );
}
