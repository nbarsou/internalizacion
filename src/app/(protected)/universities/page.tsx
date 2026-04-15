import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dbGetUniversities } from '@/features/universities/db';
import { UniversitiesTable } from '@/features/universities/components/universities-table';
import { UniversitiesToolbar } from '@/features/universities/components/universities-toolbar';

export default async function UniversitiesPage() {
  const universities = await dbGetUniversities();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Instituciones Asociadas</CardTitle>
          <CardDescription>
            Información general y rankings de universidades partners.
          </CardDescription>
        </div>
        <UniversitiesToolbar />
      </CardHeader>
      <CardContent>
        <UniversitiesTable universities={universities} />
      </CardContent>
    </Card>
  );
}
