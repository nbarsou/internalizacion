// src/features/refs/components/edit-beneficiary-modal.tsx
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

import {
  actionUpdateBeneficiary,
  type BeneficiaryActionState,
} from '../actions';
import {
  BENEFICIARY_FIELDS,
  beneficiaryInputSchema,
  type BeneficiaryFields,
  type BeneficiaryInput,
} from '../schemas';
import type { BeneficiaryRow } from './beneficiary-table';

const fieldId = (field: BeneficiaryFields) =>
  `edit-beneficiary-${field}` as const;
const errorId = (field: BeneficiaryFields) =>
  `edit-beneficiary-${field}-error` as const;

interface EditBeneficiaryModalProps {
  item: BeneficiaryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
}

export function EditBeneficiaryModal({
  item,
  open,
  onOpenChange,
  title,
}: EditBeneficiaryModalProps) {
  const boundAction = useMemo(
    () => actionUpdateBeneficiary.bind(null, item?.id ?? 0),
    [item?.id]
  );

  const submissionKeyRef = useRef(0);
  const handledKeyRef = useRef(0);

  const [state, dispatch, isPending] = useActionState<
    BeneficiaryActionState,
    FormData
  >(boundAction, null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: clientErrors },
  } = useForm<BeneficiaryInput>({
    resolver: zodResolver(beneficiaryInputSchema),
    mode: 'onBlur',
    defaultValues: { cve: '', value: '', color: '' },
  });

  // Populate form when item changes
  useEffect(() => {
    if (item) {
      reset({
        cve: item.cve,
        value: item.value,
        color: item.color ?? '',
      });
    }
  }, [item, reset]);

  // Deferred reset on close
  useEffect(() => {
    if (open || !item) return;
    const id = setTimeout(() => {
      reset({ cve: item.cve, value: item.value, color: item.color ?? '' });
    }, 0);
    return () => clearTimeout(id);
  }, [open, item, reset]);

  // Stale-state server response handling
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

  function onSubmit(data: BeneficiaryInput) {
    const fd = new FormData();
    fd.set('cve', data.cve);
    fd.set('value', data.value);
    fd.set('color', data.color);
    startTransition(() => dispatch(fd));
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    submissionKeyRef.current += 1;
    handleSubmit(onSubmit)(e);
  }

  const cveError =
    clientErrors.cve?.message ??
    (state?.type === 'validation' ? state.errors?.cve?.[0] : undefined);
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
          <DialogTitle>Editar en {title}</DialogTitle>
          <DialogDescription>
            Los cambios se aplicarán a todos los convenios vinculados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Field data-invalid={!!cveError}>
            <FieldLabel htmlFor={fieldId('cve')}>
              {BENEFICIARY_FIELDS.cve.label}
              {BENEFICIARY_FIELDS.cve.required && (
                <span aria-hidden className="text-destructive ml-0.5">
                  *
                </span>
              )}
            </FieldLabel>
            <Input
              id={fieldId('cve')}
              disabled={isPending}
              aria-invalid={!!cveError}
              aria-describedby={cveError ? errorId('cve') : undefined}
              {...register('cve')}
            />
            {cveError && (
              <FieldError id={errorId('cve')}>{cveError}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!valueError}>
            <FieldLabel htmlFor={fieldId('value')}>
              {BENEFICIARY_FIELDS.value.label}
              {BENEFICIARY_FIELDS.value.required && (
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
              {BENEFICIARY_FIELDS.color.label}
            </FieldLabel>
            <Input
              id={fieldId('color')}
              placeholder="#000000 (Opcional)"
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
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
