'use client';

import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_OPTIONS, ROLE_LABELS, type Role } from '@/lib/enums';
import { changeUserRoleAction } from '../actions';

interface UpdateRoleSelectProps {
  userId: string;
  currentRole: Role;
  actingIsSuperuser: boolean;
}

export function UpdateRoleSelect({
  userId,
  currentRole,
  actingIsSuperuser,
}: UpdateRoleSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticRole, setOptimisticRole] = useOptimistic(currentRole);

  function handleRoleChange(newRole: string) {
    startTransition(async () => {
      setOptimisticRole(newRole as Role);
      const result = await changeUserRoleAction(userId, newRole as Role);
      if (result?.type === 'success') {
        toast.success(result.message);
      } else if (result?.type === 'error') {
        toast.error(result.message);
      }
    });
  }

  // En el render, filtrar opciones:
  const options = ROLE_OPTIONS.filter(
    (r) => actingIsSuperuser || r !== 'ADMIN'
  );

  return (
    <Select
      value={optimisticRole}
      onValueChange={handleRoleChange}
      disabled={isPending}
    >
      <SelectTrigger className="h-8 w-36 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((role) => (
          <SelectItem key={role} value={role} className="text-xs">
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
