'use client';

import { UpdateRoleSelect } from './update-role-select';
import { UpdateExpiryPicker } from './update-expiry-picker';
import type { UsersDTO } from '../db';
import type { Permission } from '@/lib/permissions';
import { ROLE_LABELS } from '@/lib/enums';

interface UserRowProps {
  user: UsersDTO;
  can: Record<Permission, boolean>;
}

export function UserRow({ user, can }: UserRowProps) {
  const isOwner = user.isSuperuser;

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-muted-foreground text-xs">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isOwner ? (
          <span className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs font-medium">
            {ROLE_LABELS['ADMIN']}
          </span>
        ) : can['user:change_role'] ? (
          <>
            <UpdateExpiryPicker
              userId={user.id}
              expiresAt={user.permissionExpiresAt}
            />
            <UpdateRoleSelect userId={user.id} currentRole={user.role} />
          </>
        ) : (
          <span className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs">
            {ROLE_LABELS[user.role]}
          </span>
        )}
      </div>
    </div>
  );
}
