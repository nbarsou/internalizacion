'use client';

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  changeUserRoleAction,
  type ChangeRoleTFields,
  type ChangeRoleActionState,
} from '../actions';
import {
  changeRoleSchema,
  ROLE_LABELS,
  type ChangeRoleInput,
} from '../schemas';
import type { AdminUser } from '../db';
import { ASSIGNABLE_ROLES } from '@/lib/role';

// ID helpers — scoped to this modal so no collisions if two forms mount together
const fieldId = (field: ChangeRoleTFields) => `role-selector-${field}` as const;
const errorId = (field: ChangeRoleTFields) =>
  `role-selector-${field}-error` as const;

interface RoleSelectorProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleSelector({ user, open, onOpenChange }: RoleSelectorProps) {
  // Bind targetUserId — useMemo keeps the reference stable so useActionState
  // doesn't reinitialise on every render.
  const boundAction = useMemo(
    () => changeUserRoleAction.bind(null, user?.id ?? ''),
    [user?.id]
  );

  // Stale state guard — see modal.md § Stale State
  const submissionKeyRef = useRef(0);
  const handledKeyRef = useRef(0);

  const [state, dispatch, isPending] = useActionState<
    ChangeRoleActionState,
    FormData
  >(boundAction, null);

  const {
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors: clientErrors },
  } = useForm<ChangeRoleInput>({
    resolver: zodResolver(changeRoleSchema),
    mode: 'onBlur',
    defaultValues: { role: 'VIEWER' },
  });

  // Pre-populate when a different user is passed in
  useEffect(() => {
    if (user) reset({ role: user.role as ChangeRoleInput['role'] });
  }, [user, reset]);

  // Reset on close — deferred to avoid animation flicker
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => {
      reset();
    }, 0);
    return () => clearTimeout(id);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle server response — stale state guard prevents firing on reopen
  useEffect(() => {
    if (!open) return;
    if (handledKeyRef.current >= submissionKeyRef.current) return;

    if (state?.success) {
      handledKeyRef.current = submissionKeyRef.current;
      toast.success(state.message);
      onOpenChange(false);
    } else if (state?.message && !state.success) {
      handledKeyRef.current = submissionKeyRef.current;
      toast.error(state.message);
    }
  }, [state, open, onOpenChange]);

  // Pure — builds FormData, no ref access
  function onSubmit(data: ChangeRoleInput) {
    const formData = new FormData();
    const set = (key: ChangeRoleTFields, value: string) =>
      formData.set(key, value);
    set('role', data.role);
    startTransition(() => dispatch(formData));
  }

  // Owns ref mutation — wired to <form onSubmit>
  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    submissionKeyRef.current += 1;
    handleSubmit(onSubmit)(e);
  }

  const roleError = clientErrors.role?.message ?? state?.errors?.role?.[0];
  // useWatch is React Compiler-safe; watch() returns a new function reference
  // each render which the compiler cannot memoize safely.
  const currentRole = useWatch({ control, name: 'role' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar rol</DialogTitle>
          <DialogDescription>
            Actualiza el rol de{' '}
            <span className="text-foreground font-medium">{user?.name}</span>.
            El cambio tendrá efecto en su próxima solicitud.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor={fieldId('role')}
              className="text-sm leading-none font-medium"
            >
              Rol
            </label>

            <Select
              value={currentRole}
              onValueChange={(val: string) =>
                setValue('role', val as ChangeRoleInput['role'], {
                  shouldValidate: true,
                })
              }
              disabled={isPending}
            >
              <SelectTrigger
                id={fieldId('role')}
                aria-invalid={!!roleError}
                aria-describedby={roleError ? errorId('role') : undefined}
              >
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {roleError && (
              <p id={errorId('role')} className="text-destructive text-sm">
                {roleError}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
