import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dbGetAllRefs } from '@/features/refs/db';
import { CreateUniversityForm } from '@/features/universities/components/create-university-form';

export default async function CreateUniversityPage() {
  const refs = await dbGetAllRefs();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="gap-1 pl-0" asChild>
          <Link href="/universities">
            <ArrowLeft className="h-4 w-4" />
            Todas las instituciones
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva institución</CardTitle>
          <CardDescription>
            Registra una nueva universidad o institución partner. Los campos
            marcados con <span className="text-destructive">*</span> son
            obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUniversityForm refs={refs} />
        </CardContent>
      </Card>
    </div>
  );
}
