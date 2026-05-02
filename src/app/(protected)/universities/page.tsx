import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dbGetUniversities } from '@/features/universities/db';
import { UniversitiesClientTable } from '@/features/universities/components/universities-client-table';
import { requirePermission } from '@/lib/authz';

export default async function UniversitiesPage() {
  const { can } = await requirePermission('read:university');
  const canCreate = can['write:university'];

  const universities = await dbGetUniversities();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Instituciones Asociadas</CardTitle>
        <CardDescription>
          {universities.length} instituciones partners registradas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UniversitiesClientTable data={universities} canCreate={canCreate} />
      </CardContent>
    </Card>
  );
}
