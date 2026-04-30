'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { startTransition, useActionState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { ROLE_OPTIONS, ROLE_LABELS } from '@/lib/enums';
import { createInviteAction, InviteActionState } from '../actions';
import {
  INVITE_FIELDS,
  InviteFields,
  InviteInput,
  inviteSchema,
} from '../schemas';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

const fieldId = (field: InviteFields) => `create-member-${field}` as const;
const errorId = (field: InviteFields) =>
  `create-member-${field}-error` as const;

/** Always-present error slot — reserves height so the row never jumps */
function ErrorSlot({ id, message }: { id?: string; message?: string }) {
  return (
    <div className="min-h-[1.1rem]" aria-live="polite">
      {message && (
        <FieldError id={id} className="mt-0.5 text-xs">
          {message}
        </FieldError>
      )}
    </div>
  );
}

export function InviteForm() {
  const [state, dispatch, isPending] = useActionState<
    InviteActionState,
    FormData
  >(createInviteAction, null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors: clientErrors, isDirty },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    mode: 'onBlur',
    defaultValues: { email: '', role: 'VIEWER', expiresAt: undefined },
  });

  useEffect(() => {
    if (!state) return;
    switch (state.type) {
      case 'validation':
        break;
      case 'error':
        toast.error(state.message);
        break;
      case 'success':
        toast.success(state.message);
        reset();
        break;
    }
  }, [state, reset]);

  function onSubmit(data: InviteInput) {
    const formData = new FormData();
    const set = (key: InviteFields, value: string) => formData.set(key, value);
    set('email', data.email);
    set('role', data.role);
    set('expiresAt', data.expiresAt ? data.expiresAt.toISOString() : '');
    startTransition(() => dispatch(formData));
  }

  const serverErrors = state?.type === 'validation' ? state.errors : undefined;
  const emailError = clientErrors.email?.message ?? serverErrors?.email?.[0];
  const roleError = clientErrors.role?.message ?? serverErrors?.role?.[0];
  const expiresAtError =
    clientErrors.expiresAt?.message ?? serverErrors?.expiresAt?.[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/*
        Each column is a `flex flex-col`.
        The ErrorSlot at the bottom of every column is always rendered,
        even when empty, so all inputs stay top-aligned and the row
        never shifts when errors appear or disappear.
        The button column uses the same pattern with an empty slot.
      */}
      <div className="flex items-start gap-3">
        {/* ── Email (grows to fill remaining space) ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Field data-invalid={!!emailError}>
            <FieldLabel htmlFor={fieldId('email')}>
              {INVITE_FIELDS.email.label}
              {INVITE_FIELDS.email.required && (
                <span aria-hidden className="text-destructive ml-0.5">
                  *
                </span>
              )}
            </FieldLabel>
            <Input
              id={fieldId('email')}
              type="email"
              placeholder="jane@ejemplo.com"
              disabled={isPending}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? errorId('email') : undefined}
              {...register('email')}
            />
          </Field>
          <ErrorSlot id={errorId('email')} message={emailError} />
        </div>

        {/* ── Role (fixed width) ── */}
        <div className="flex w-36 shrink-0 flex-col">
          <Field data-invalid={!!roleError}>
            <FieldLabel htmlFor={fieldId('role')}>
              {INVITE_FIELDS.role.label}
              {INVITE_FIELDS.role.required && (
                <span aria-hidden className="text-destructive ml-0.5">
                  *
                </span>
              )}
            </FieldLabel>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  disabled={isPending}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id={fieldId('role')}
                    aria-invalid={!!roleError}
                    aria-describedby={roleError ? errorId('role') : undefined}
                  >
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.filter((v) => v !== 'ADMIN').map((v) => (
                      <SelectItem key={v} value={v}>
                        {ROLE_LABELS[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <ErrorSlot id={errorId('role')} message={roleError} />
        </div>

        {/* ── Expiry date (fixed width) ── */}
        <div className="flex w-48 shrink-0 flex-col">
          <Field data-invalid={!!expiresAtError}>
            <FieldLabel htmlFor={fieldId('expiresAt')}>
              {INVITE_FIELDS.expiresAt.label}
              {INVITE_FIELDS.expiresAt.required && (
                <span aria-hidden className="text-destructive ml-0.5">
                  *
                </span>
              )}
            </FieldLabel>
            <Controller
              control={control}
              name="expiresAt"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id={fieldId('expiresAt')}
                      variant="outline"
                      type="button"
                      disabled={isPending}
                      aria-invalid={!!expiresAtError}
                      aria-describedby={
                        expiresAtError ? errorId('expiresAt') : undefined
                      }
                      data-empty={!field.value}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        'data-[empty=true]:text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      {field.value ? (
                        format(field.value, 'PPP', { locale: es })
                      ) : (
                        <span>Sin expiración</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </Field>
          <ErrorSlot id={errorId('expiresAt')} message={expiresAtError} />
        </div>

        {/* ── Submit button — padded to align with inputs, not labels ── */}
        <div className="mb-[1.1rem] shrink-0 self-end">
          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" /> Guardando...
              </>
            ) : (
              'Invitar'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
