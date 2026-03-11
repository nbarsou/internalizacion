import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-foreground mb-2 text-6xl font-bold">403</h1>
        <h2 className="text-foreground mb-4 text-2xl font-semibold">
          Acceso Restringido
        </h2>
        <p className="text-muted-foreground mb-8">
          Lo sentimos, parece que no tienes permisos para ver esta página.
        </p>

        {/* Container for stacked buttons */}
        <div className="mx-auto flex w-full max-w-xs flex-col gap-3">
          {/* Primary Action */}
          <Button asChild size="lg" className="w-full text-base">
            <Link href="/dashboard">Regresar al dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
