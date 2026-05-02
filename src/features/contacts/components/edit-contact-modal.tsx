'use client';

import React, {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
} from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { CONTACT_CONCERN_OPTIONS, CONTACT_VALUE_OPTIONS } from '@/lib/enums';

import { updateContactAction, type ContactActionResult } from '../actions';
import {
  contactSchema,
  type ContactFields,
  type ContactInput,
} from '../schemas';
import type { ContactDTO } from '../db';

const fieldId = (field: ContactFields) => `edit-contact-${field}` as const;
const errorId = (field: ContactFields) =>
  `edit-contact-${field}-error` as const;

// ── Modal wrapper ─────────────────────────────────────────────────────────────

interface EditContactModalProps {
  slug: string;
  item: ContactDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContactModal({
  slug,
  item,
  open,
  onOpenChange,
}: EditContactModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Contacto</DialogTitle>
          <DialogDescription>
            Modifica la información de este contacto.
          </DialogDescription>
        </DialogHeader>

        {/* Conditionally render the form ONLY when item exists */}
        {item ? (
          <EditContactForm
            slug={slug}
            item={item}
            onSuccess={() => onOpenChange(false)}
          />
        ) : (
          <div className="flex justify-center p-8">
            <Spinner /> {/* Shows briefly while closing/animating out */}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Inner form ────────────────────────────────────────────────────────────────

interface EditContactFormProps {
  slug: string;
  item: ContactDTO;
  onSuccess: () => void;
}

function EditContactForm({ slug, item, onSuccess }: EditContactFormProps) {
  const defaultValues = useMemo<ContactInput>(
    () => ({
      name: item.name ?? '',
      concernType: item.concernType as ContactInput['concernType'],
      valueType: item.valueType as ContactInput['valueType'],
      value: item.value,
    }),
    [item]
  );

  const boundAction = useMemo(
    () => updateContactAction.bind(null, item.id, slug),
    [item.id, slug]
  );

  // useActionState now dispatches ContactInput directly — no FormData
  const [state, dispatch, isPending] = useActionState<
    ContactActionResult,
    ContactInput
  >(boundAction, null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors: clientErrors, isDirty },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur',
    defaultValues,
  });

  // Safe for React Compiler
  const valueType = useWatch({ control, name: 'valueType' });

  useEffect(() => {
    if (!state) return;
    if (state.type === 'error') {
      toast.error(state.message);
    } else if (state.type === 'success') {
      toast.success(state.message || 'Contacto actualizado con éxito.');
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // RHF has already validated — dispatch typed object directly
  const onSubmit = (data: ContactInput) => {
    startTransition(() => dispatch(data));
  };

  const serverErrors = state?.type === 'validation' ? state.errors : undefined;

  const nameError = clientErrors.name?.message ?? serverErrors?.name?.[0];
  const concernTypeError =
    clientErrors.concernType?.message ?? serverErrors?.concernType?.[0];
  const valueTypeError =
    clientErrors.valueType?.message ?? serverErrors?.valueType?.[0];
  const valueError = clientErrors.value?.message ?? serverErrors?.value?.[0];

  const valuePlaceholder =
    valueType === 'EMAIL'
      ? 'correo@ejemplo.com'
      : valueType === 'PHONE'
        ? '+52 55 1234 5678'
        : 'Ingresa el valor';

  const valueInputType =
    valueType === 'EMAIL' ? 'email' : valueType === 'PHONE' ? 'tel' : 'text';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Concern type */}
      <Field data-invalid={!!concernTypeError}>
        <FieldLabel htmlFor={fieldId('concernType')}>Tipo</FieldLabel>
        <Controller
          control={control}
          name="concernType"
          render={({ field }) => (
            <Select
              disabled={isPending}
              value={field.value ?? ''}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id={fieldId('concernType')}
                aria-invalid={!!concernTypeError}
                aria-describedby={
                  concernTypeError ? errorId('concernType') : undefined
                }
              >
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_CONCERN_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {concernTypeError && (
          <FieldError id={errorId('concernType')}>
            {concernTypeError}
          </FieldError>
        )}
      </Field>

      {/* Value type / channel */}
      <Field data-invalid={!!valueTypeError}>
        <FieldLabel htmlFor={fieldId('valueType')}>Canal</FieldLabel>
        <Controller
          control={control}
          name="valueType"
          render={({ field }) => (
            <Select
              disabled={isPending}
              value={field.value ?? ''}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id={fieldId('valueType')}
                aria-invalid={!!valueTypeError}
                aria-describedby={
                  valueTypeError ? errorId('valueType') : undefined
                }
              >
                <SelectValue placeholder="Selecciona un canal" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_VALUE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {valueTypeError && (
          <FieldError id={errorId('valueType')}>{valueTypeError}</FieldError>
        )}
      </Field>

      {/* Value */}
      <Field data-invalid={!!valueError}>
        <FieldLabel htmlFor={fieldId('value')}>Valor</FieldLabel>
        <Input
          id={fieldId('value')}
          type={valueInputType}
          placeholder={valuePlaceholder}
          disabled={isPending}
          aria-invalid={!!valueError}
          aria-describedby={valueError ? errorId('value') : undefined}
          {...register('value')}
        />
        {valueError && (
          <FieldError id={errorId('value')}>{valueError}</FieldError>
        )}
      </Field>

      {/* Name (optional) */}
      <Field data-invalid={!!nameError}>
        <FieldLabel htmlFor={fieldId('name')}>
          Nombre{' '}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </FieldLabel>
        <Input
          id={fieldId('name')}
          placeholder="Ej. Coordinación de intercambios"
          disabled={isPending}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? errorId('name') : undefined}
          {...register('name')}
        />
        {nameError && <FieldError id={errorId('name')}>{nameError}</FieldError>}
      </Field>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" type="button" disabled={isPending}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? (
            <>
              <Spinner data-icon="inline-start" /> Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
