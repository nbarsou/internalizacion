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
import { actionCreateRef, type RefActionState } from '../actions';
import {
  REF_FIELDS,
  refInputSchema,
  type RefFields,
  type RefInput,
  type RefTableName,
} from '../schemas';

interface CreateRefModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: RefTableName;
  title: string;
}

export function CreateRefModal({
  open,
  onOpenChange,
  table,
  title,
}: CreateRefModalProps) {
  // Bind action and memoize to prevent useActionState reinitialization
  const boundAction = useMemo(() => actionCreateRef.bind(null, table), [table]);

  // Stale state guards
  const submissionKeyRef = useRef(0);
  const handledKeyRef = useRef(0);

  const [state, dispatch, isPending] = useActionState<RefActionState, RefInput>(
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

  // Dynamic IDs to prevent collision across tables/modals
  const fieldId = (field: RefFields) => `create-${table}-${field}` as const;
  const errorId = (field: RefFields) =>
    `create-${table}-${field}-error` as const;

  // Deferred reset to avoid animation flicker and exhaustive-deps lint rules
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => {
      reset();
    }, 0);
    return () => clearTimeout(id);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle server responses with stale-state protection
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

  // Pure function — builds FormData and dispatches
  function onSubmit(data: RefInput) {
    startTransition(() => dispatch(data));
  }

  // Mutates the ref — wired to the form, NEVER to handleSubmit
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
          <DialogTitle>Agregar a {title}</DialogTitle>
          <DialogDescription>
            El nuevo valor estará disponible de inmediato.
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
              placeholder="#000000 (Dejar en blanco para autogenerar)"
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
                'Agregar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
