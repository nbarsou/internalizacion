import {
  ExternalLink,
  MapPin,
  GraduationCap,
  Building2,
  Activity,
  Calendar,
  Globe,
  Cross,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { UniversityDetail } from '@/features/universities/db';

interface UniversityDisplayProps {
  university: UniversityDetail;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

export function UniversityDisplay({ university }: UniversityDisplayProps) {
  const {
    name,
    city,
    country,
    region,
    institutionType,
    campus,
    utilization,
    pagina_web,
    isCatholic,
    start,
    expires,
    address,
  } = university;

  const startYear = start ? new Date(start).getFullYear() : null;
  const expiresYear = expires ? new Date(expires).getFullYear() : null;
  const isExpired = expires ? new Date(expires) < new Date() : false;

  return (
    <div className="flex flex-col gap-6">
      {/* Name + website */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        {pagina_web && (
          <a
            href={pagina_web}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground mt-1 flex items-center gap-1 text-sm hover:text-blue-600"
          >
            <Globe className="h-3.5 w-3.5" />
            {new URL(pagina_web).hostname}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {country?.name && (
          <DetailRow
            icon={<MapPin className="h-4 w-4" />}
            label="País"
            value={
              <span>
                {[city, country.name].filter(Boolean).join(', ')}
                {region?.name && (
                  <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                    ({region.name})
                  </span>
                )}
              </span>
            }
          />
        )}

        {address && (
          <DetailRow
            icon={<Building2 className="h-4 w-4" />}
            label="Dirección"
            value={address}
          />
        )}

        {institutionType?.name && (
          <DetailRow
            icon={<GraduationCap className="h-4 w-4" />}
            label="Tipo de institución"
            value={
              <Badge
                variant="outline"
                className="border-orange-200 bg-orange-50 font-normal text-orange-700"
              >
                {institutionType.name}
              </Badge>
            }
          />
        )}

        {campus?.name && campus.id !== 0 && (
          <DetailRow
            icon={<Building2 className="h-4 w-4" />}
            label="Campus Anáhuac titular"
            value={campus.name}
          />
        )}

        {utilization && utilization.id !== 0 && (
          <DetailRow
            icon={<Activity className="h-4 w-4" />}
            label="Utilización"
            value={
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: utilization.color
                    ? `${utilization.color}20`
                    : undefined,
                  color: utilization.color ?? 'inherit',
                  borderColor: utilization.color ?? undefined,
                }}
                className="border"
              >
                {utilization.value}
              </Badge>
            }
          />
        )}

        <DetailRow
          icon={<Calendar className="h-4 w-4" />}
          label="Vigencia"
          value={
            <span className={isExpired ? 'text-red-600' : undefined}>
              {startYear ?? '—'}
              {' → '}
              {expiresYear ? (
                <span>
                  {expiresYear}
                  {isExpired && ' (vencido)'}
                </span>
              ) : (
                'Indefinido'
              )}
            </span>
          }
        />

        <DetailRow
          icon={<Cross className="h-4 w-4" />}
          label="Afiliación católica"
          value={isCatholic ? 'Sí' : 'No'}
        />
      </div>
    </div>
  );
}
