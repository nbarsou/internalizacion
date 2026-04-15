import { Download, Filter, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function UniversitiesToolbar() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative mr-2 hidden sm:block">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input
          type="search"
          placeholder="Buscar universidad..."
          className="h-8 w-50 pl-8"
        />
      </div>
      <Button variant="outline" size="sm" className="h-8 gap-1">
        <Filter className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          Filtrar
        </span>
      </Button>
      <Button variant="outline" size="sm" className="h-8 gap-1">
        <Download className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          Exportar
        </span>
      </Button>
      <Button
        size="sm"
        className="h-8 gap-1 bg-orange-600 text-white hover:bg-orange-700"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          Nueva Institución
        </span>
      </Button>
    </div>
  );
}
