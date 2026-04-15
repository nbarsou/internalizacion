import { ExternalLink, GraduationCap, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UniversityDetail } from '@/features/universities/db';

interface UniversityHeaderProps {
  university: UniversityDetail;
}

export function UniversityHeader({ university }: UniversityHeaderProps) {
  const { name, city, country, institutionType, pagina_web, campus } =
    university;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
          {(city ?? country?.name) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {[city, country?.name].filter(Boolean).join(', ')}
            </span>
          )}
          {institutionType?.name && (
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              {institutionType.name}
            </span>
          )}
          {campus?.name && (
            <span className="text-muted-foreground text-xs">
              Campus {campus.name}
            </span>
          )}
          {pagina_web && (
            <a
              href={pagina_web}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              {new URL(pagina_web).hostname}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      <Button
        size="sm"
        className="h-8 gap-1 bg-orange-600 text-white hover:bg-orange-700 sm:mt-1"
      >
        <Plus className="h-3.5 w-3.5" />
        Nuevo Convenio
      </Button>
    </div>
  );
}
