'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Role } from '@/generated/prisma/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleSelector } from './role-selector';
import { RemoveUserModal } from './remove-user-modal';
import { ROLE_LABELS, ROLE_BADGE_COLORS } from '../schemas';
import type { AdminUser } from '../db';
import type { Permission } from '@/lib/permissions';

// ── Modal state — discriminated union ────────────────────────────────────────
// One variable owns both which modal is open and which user it operates on.
// Structurally impossible to be in 'edit' state without a user to edit.
type ModalState =
  | { type: 'closed' }
  | { type: 'edit'; user: AdminUser }
  | { type: 'delete'; user: AdminUser };

interface UserTableProps {
  users: AdminUser[];
  currentUserId: string;
  can: Record<Permission, boolean>;
}

export function UserTable({ users, currentUserId, can }: UserTableProps) {
  const [modal, setModal] = useState<ModalState>({ type: 'closed' });
  const close = () => setModal({ type: 'closed' });

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Usuario</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="hidden md:table-cell">Registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <TableRow key={user.id}>
                  {/* Avatar + name */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {user.name}
                        {isSelf && (
                          <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                            (tú)
                          </span>
                        )}
                      </span>
                    </div>
                  </TableCell>

                  {/* Email */}
                  <TableCell className="text-muted-foreground text-sm">
                    {user.email}
                  </TableCell>

                  {/* Role badge */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        ROLE_BADGE_COLORS[user.role as Role]
                      }`}
                    >
                      {ROLE_LABELS[user.role as Role]}
                    </span>
                  </TableCell>

                  {/* Created at */}
                  <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                    {new Date(user.createdAt).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">
                            Acciones de {user.name}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                        {can['member:change_role'] && (
                          <DropdownMenuItem
                            // Self-modification is blocked in the DAL too,
                            // but disabling it in the UI avoids a confusing error.
                            disabled={isSelf}
                            onClick={() => setModal({ type: 'edit', user })}
                          >
                            Cambiar rol
                          </DropdownMenuItem>
                        )}

                        {can['member:remove'] && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={isSelf}
                              className="text-destructive focus:text-destructive"
                              onClick={() => setModal({ type: 'delete', user })}
                            >
                              Eliminar acceso
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}

            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-12 text-center text-sm"
                >
                  No hay usuarios registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/*
        Both modals are always rendered — never conditional.
        open is derived from the union type.
        user is passed as null when the modal is not active — the modal is
        mounted but receives no data. When a row action is clicked, the union
        switches variant and the modal receives the real user.
      */}
      <RoleSelector
        user={modal.type === 'edit' ? modal.user : null}
        open={modal.type === 'edit'}
        onOpenChange={(open: boolean) => !open && close()}
      />

      <RemoveUserModal
        user={modal.type === 'delete' ? modal.user : null}
        open={modal.type === 'delete'}
        onOpenChange={(open: boolean) => !open && close()}
      />
    </div>
  );
}
