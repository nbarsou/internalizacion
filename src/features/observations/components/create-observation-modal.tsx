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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import {
  createObservationAction,
  type ObservationActionState,
} from '../actions';
import {
  observationSchema,
  ObservationFields,
  ObservationInput,
} from '../schemas';

const fieldId = (field: ObservationFields) => `create-obs-${field}` as const;
const errorId = (field: ObservationFields) =>
  `create-obs-${field}-error` as const;

interface CreateObservationModalProps {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateObservationModal({
  slug,
  open,
  onOpenChange,
}: CreateObservationModalProps) {
  const boundAction = useMemo(
    () => createObservationAction.bind(null, slug),
    [slug]
  );

  const submissionKeyRef = useRef(0);
  const handledKeyRef = useRef(0);

  const [state, dispatch, isPending] = useActionState<
    ObservationActionState,
    ObservationInput
  >(boundAction, null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: clientErrors },
  } = useForm<ObservationInput>({
    resolver: zodResolver(observationSchema),
    mode: 'onBlur',
    defaultValues: { text: '' },
  });

  // Reset on close — deferred to avoid animation flicker
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => {
      reset();
    }, 0);
    return () => clearTimeout(id);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle server response — submission key guards against stale state
  useEffect(() => {
    if (!open) return;
    if (handledKeyRef.current >= submissionKeyRef.current) return;

    if (state?.type === 'success') {
      handledKeyRef.current = submissionKeyRef.current;
      toast.success(state.message);
      onOpenChange(false);
    } else if (state?.type === 'error') {
      handledKeyRef.current = submissionKeyRef.current;
      toast.error(state.message);
    }
  }, [state, open, onOpenChange]);

  // Pure — no ref access, safe to pass to handleSubmit
  function onSubmit(data: ObservationInput) {
    startTransition(() => dispatch(data));
  }

  // Owns ref mutation — wired to <form onSubmit>
  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    submissionKeyRef.current += 1;
    handleSubmit(onSubmit)(e);
  }

  const textError =
    clientErrors.text?.message ??
    (state?.type === 'validation' ? state.errors?.text?.[0] : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Observación</DialogTitle>
          <DialogDescription>
            Agrega una observación manual a esta universidad.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Field data-invalid={!!textError}>
            <FieldLabel htmlFor={fieldId('text')}>Observación</FieldLabel>
            <Textarea
              id={fieldId('text')}
              disabled={isPending}
              aria-invalid={!!textError}
              aria-describedby={textError ? errorId('text') : undefined}
              rows={4}
              placeholder="Escribe una observación..."
              {...register('text')}
            />
            {textError && (
              <FieldError id={errorId('text')}>{textError}</FieldError>
            )}
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" /> Creando...
                </>
              ) : (
                'Crear'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
