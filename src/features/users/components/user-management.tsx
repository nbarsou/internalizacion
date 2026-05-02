// features/users/components/user-management.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UsersDTO } from '../db';
import { UserRow } from './user-row';
import type { Permission } from '@/lib/permissions';

interface UserManagementProps {
  users: UsersDTO[];
  can: Record<Permission, boolean>;
  actingUserId: string;
  actingIsSuperuser: boolean;
}

export function UserManagement({
  users,
  actingUserId,
  actingIsSuperuser,
}: UserManagementProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle> Usuarios </CardTitle>
        <CardDescription className="text-xs">
          Administra el acceso de los usuarios en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-5">
        <div className="divide-y rounded-lg border">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              actingUserId={actingUserId}
              actingIsSuperuser={actingIsSuperuser}
            />
          ))}
          {users.length === 0 && (
            <div className="text-muted-foreground p-6 text-center text-sm">
              No hay miembros registrados todavía.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
