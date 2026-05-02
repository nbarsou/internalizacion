import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dbGetAgreements, redactAgreements } from '@/features/agreements/db';
import { AgreementsClientTable } from '@/features/agreements/components/agreements-client-table';
import { requirePermission } from '@/lib/authz';

export default async function AgreementsPage() {
  const { can } = await requirePermission('read:agreement'); // or whatever gate you use
  const raw = await dbGetAgreements();
  const agreements = redactAgreements(raw, can['read:sensitive']);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Base de Datos de Convenios</CardTitle>
        <CardDescription>
          {agreements.length} convenios registrados con instituciones partner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AgreementsClientTable
          data={agreements}
          canReadSensitive={can['read:sensitive']}
        />
      </CardContent>
    </Card>
  );
}
