'use client';

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { actionUpdateRef, type RefActionState } from '../actions';
import {
  REF_FIELDS,
  refInputSchema,
  type RefFields,
  type RefInput,
  type RefTableName,
} from '../schemas';

// Minimal type for the injected item data
export interface RefItem {
  id: number;
  value: string;
  color?: string | null;
}

interface EditRefModalProps {
  item: RefItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: RefTableName;
  title: string;
}

export function EditRefModal({
  item,
  open,
  onOpenChange,
  table,
  title,
}: EditRefModalProps) {
  // Bind item ID safely. 0 is used as a fallback since empty string isn't valid for a number,
  // but it will never be fired because the discriminated union guards the submit.
  const boundAction = useMemo(
    () => actionUpdateRef.bind(null, item?.id ?? 0, table),
    [item?.id, table]
  );

  const submissionKeyRef = useRef(0);
  const handledKeyRef = useRef(0);

  const [state, dispatch, isPending] = useActionState<RefActionState, FormData>(
    boundAction,
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: clientErrors },
  } = useForm<RefInput>({
    resolver: zodResolver(refInputSchema),
    mode: 'onBlur',
    defaultValues: { value: '', color: '' },
  });

  const fieldId = (field: RefFields) => `edit-${table}-${field}` as const;
  const errorId = (field: RefFields) => `edit-${table}-${field}-error` as const;

  // Pre-populate when the selected item changes
  useEffect(() => {
    if (item) {
      reset({ value: item.value, color: item.color ?? '' });
    }
  }, [item, reset]);

  // Deferred reset on close
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => {
      reset();
    }, 0);
    return () => clearTimeout(id);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !state) return;
    if (handledKeyRef.current >= submissionKeyRef.current) return;

    if (state.type === 'success') {
      handledKeyRef.current = submissionKeyRef.current;
      toast.success(state.message);
      onOpenChange(false);
    } else if (state.type === 'error') {
      handledKeyRef.current = submissionKeyRef.current;
      toast.error(state.message);
    }
  }, [state, open, onOpenChange]);

  function onSubmit(data: RefInput) {
    const fd = new FormData();
    fd.set('value', data.value);
    fd.set('color', data.color);
    startTransition(() => dispatch(fd));
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    submissionKeyRef.current += 1;
    handleSubmit(onSubmit)(e);
  }

  const valueError =
    clientErrors.value?.message ??
    (state?.type === 'validation' ? state.errors?.value?.[0] : undefined);
  const colorError =
    clientErrors.color?.message ??
    (state?.type === 'validation' ? state.errors?.color?.[0] : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar {title}</DialogTitle>
          <DialogDescription>
            Modifica la información de este registro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Field data-invalid={!!valueError}>
            <FieldLabel htmlFor={fieldId('value')}>
              {REF_FIELDS.value.label}
              {REF_FIELDS.value.required && (
                <span aria-hidden className="text-destructive ml-0.5">
                  *
                </span>
              )}
            </FieldLabel>
            <Input
              id={fieldId('value')}
              disabled={isPending}
              aria-invalid={!!valueError}
              aria-describedby={valueError ? errorId('value') : undefined}
              {...register('value')}
            />
            {valueError && (
              <FieldError id={errorId('value')}>{valueError}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!colorError}>
            <FieldLabel htmlFor={fieldId('color')}>
              {REF_FIELDS.color.label}
            </FieldLabel>
            <Input
              id={fieldId('color')}
              disabled={isPending}
              aria-invalid={!!colorError}
              aria-describedby={colorError ? errorId('color') : undefined}
              {...register('color')}
            />
            {colorError && (
              <FieldError id={errorId('color')}>{colorError}</FieldError>
            )}
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" /> Guardando…
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
