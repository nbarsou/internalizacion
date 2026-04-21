import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dbGetAgreements } from '@/features/agreements/db';
import { AgreementsClientTable } from '@/features/agreements/components/agreements-client-table';

export default async function AgreementsPage() {
  const agreements = await dbGetAgreements();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Base de Datos de Convenios</CardTitle>
        <CardDescription>
          {agreements.length} convenios registrados con instituciones partner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AgreementsClientTable data={agreements} />
      </CardContent>
    </Card>
  );
}
