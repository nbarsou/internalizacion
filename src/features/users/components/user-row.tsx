'use client';

import { UpdateRoleSelect } from './update-role-select';
import { UpdateExpiryPicker } from './update-expiry-picker';
import type { UsersDTO } from '../db';
import { ROLE_LABELS } from '@/lib/enums';

interface UserRowProps {
  user: UsersDTO;
  actingUserId: string;
  actingIsSuperuser: boolean;
  canWrite: boolean;
}

export function UserRow({
  user,
  canWrite,
  actingUserId,
  actingIsSuperuser,
}: UserRowProps) {
  const isSelf = user.id === actingUserId;

  // Tienes write:user (eres ADMIN o superuser).
  // No puedes modificarte a ti mismo.
  // No puedes modificar a un superuser.
  // Si no eres superuser, no puedes modificar a otro ADMIN.
  const canModify =
    canWrite &&
    !isSelf &&
    !user.isSuperuser &&
    (actingIsSuperuser || user.role !== 'ADMIN');

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium">
            {user.name}
            {isSelf && (
              <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                (tú)
              </span>
            )}
          </p>
          <p className="text-muted-foreground text-xs">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canModify ? (
          <>
            <UpdateExpiryPicker
              userId={user.id}
              expiresAt={user.permissionExpiresAt}
            />
            <UpdateRoleSelect
              userId={user.id}
              currentRole={user.role}
              actingIsSuperuser={actingIsSuperuser}
            />
          </>
        ) : (
          <span className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs font-medium">
            {ROLE_LABELS[user.role]}
          </span>
        )}
      </div>
    </div>
  );
}
