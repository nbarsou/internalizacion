'use client';

import React, {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
} from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
  FieldSet,
} from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';

import { updateAgreementAction, type AgreementActionResult } from '../actions';
import {
  agreementSchema,
  AGREEMENT_FIELDS,
  type AgreementFields,
  type AgreementInput,
} from '../schemas';
import type { AgreementDTO } from '../db';
import { AllRefs } from '@/features/refs/db';

const fieldId = (field: AgreementFields) => `edit-agreement-${field}` as const;
const errorId = (field: AgreementFields) =>
  `edit-agreement-${field}-error` as const;

interface EditAgreementModalProps {
  universitySlug: string;
  agreement: AgreementDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refs: AllRefs;
}

export function EditAgreementModal({
  universitySlug,
  agreement,
  open,
  onOpenChange,
  refs,
}: EditAgreementModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Convenio</DialogTitle>
          <DialogDescription>
            Modifica la información del convenio.
          </DialogDescription>
        </DialogHeader>

        {/* 👇 2. Conditionally render the form ONLY when agreement exists */}
        {agreement ? (
          <EditAgreementForm
            universitySlug={universitySlug}
            agreement={agreement}
            refs={refs}
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

interface EditAgreementFormProps {
  universitySlug: string;
  agreement: AgreementDTO;
  refs: AllRefs;
  onSuccess: () => void;
}

function EditAgreementForm({
  universitySlug,
  agreement,
  refs,
  onSuccess,
}: EditAgreementFormProps) {
  const typeAnchor = useComboboxAnchor();
  const attrAnchor = useComboboxAnchor();
  const benAnchor = useComboboxAnchor();

  const defaultValues = useMemo<AgreementInput>(
    () => ({
      typeId: agreement.typeId,
      statusId: agreement.statusId,
      spots: agreement.spots ?? undefined,
      link_convenio: agreement.link_convenio ?? '',
      attrIds: agreement.attrs?.map((a) => a.attr.id) ?? [],
      beneficiaryIds:
        agreement.beneficiaries?.map((b) => b.beneficiary.id) ?? [],
    }),
    [agreement]
  );

  const boundAction = useMemo(
    () => updateAgreementAction.bind(null, agreement.id, universitySlug),
    [agreement.id, universitySlug]
  );

  // useActionState now dispatches AgreementInput directly — no FormData
  const [state, dispatch, isPending] = useActionState<
    AgreementActionResult,
    AgreementInput
  >(boundAction, null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors: clientErrors, isDirty },
  } = useForm<AgreementInput>({
    resolver: zodResolver(agreementSchema),
    mode: 'onBlur',
    defaultValues,
  });

  useEffect(() => {
    if (!state) return;
    if (state.type === 'error') {
      toast.error(state.message);
    } else if (state.type === 'success') {
      toast.success(state.message || 'Convenio actualizado con éxito.');
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // RHF has already validated — just dispatch the typed object directly.
  // No FormData, no serialization, no coercion.
  const onSubmit = (data: AgreementInput) => {
    startTransition(() => dispatch(data));
  };

  const serverErrors = state?.type === 'validation' ? state.errors : undefined;

  const typeIdError = clientErrors.typeId?.message ?? serverErrors?.typeId?.[0];
  const statusIdError =
    clientErrors.statusId?.message ?? serverErrors?.statusId?.[0];
  const spotsError = clientErrors.spots?.message ?? serverErrors?.spots?.[0];
  const linkError =
    clientErrors.link_convenio?.message ?? serverErrors?.link_convenio?.[0];
  const attrIdsError =
    clientErrors.attrIds?.message ?? serverErrors?.attrIds?.[0];
  const beneficiaryIdsError =
    clientErrors.beneficiaryIds?.message ?? serverErrors?.beneficiaryIds?.[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup>
        <FieldSet className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Type */}
          <Field data-invalid={!!typeIdError}>
            <FieldLabel htmlFor={fieldId('typeId')}>
              {AGREEMENT_FIELDS.typeId.label}
              {AGREEMENT_FIELDS.typeId.required && (
                <span aria-hidden className="text-destructive ml-0.5">
                  *
                </span>
              )}
            </FieldLabel>
            <Controller
              control={control}
              name="typeId"
              render={({ field }) => (
                <Combobox
                  autoHighlight
                  items={refs.agreementTypes}
                  itemToStringValue={(
                    attr: (typeof refs.agreementTypes)[number]
                  ) => attr.value}
                  id={fieldId('typeId')}
                  disabled={isPending}
                  aria-invalid={!!typeIdError}
                  aria-describedby={typeIdError ? errorId('typeId') : undefined}
                  // 🔥 FIX 2: Changed `|| null` to `|| undefined` to prevent Combobox loop
                  value={
                    field.value
                      ? (refs.agreementTypes.find(
                          (t) => t.id === field.value
                        ) ?? null)
                      : null
                  }
                  onValueChange={(selectedItem) => {
                    const newId = selectedItem?.id ?? undefined;
                    // 👇 2. Break the infinite loop! Only trigger onChange if it ACTUALLY changed
                    if (field.value !== newId) {
                      field.onChange(newId);
                    }
                  }}
                >
                  <ComboboxInput placeholder="Selecciona un tipo" />
                  <ComboboxContent
                    anchor={typeAnchor}
                    className="pointer-events-auto"
                    onPointerDown={(e) => e.preventDefault()}
                  >
                    <ComboboxEmpty>
                      No se encontraron tipos de convenio.
                    </ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item.id} value={item}>
                          {item.value}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
            />
            {typeIdError && (
              <FieldError id={errorId('typeId')}>{typeIdError}</FieldError>
            )}
          </Field>

          {/* Status */}
          <Field data-invalid={!!statusIdError}>
            <FieldLabel htmlFor={fieldId('statusId')}>
              {AGREEMENT_FIELDS.statusId.label}
              {AGREEMENT_FIELDS.statusId.required && (
                <span aria-hidden className="text-destructive ml-0.5">
                  *
                </span>
              )}
            </FieldLabel>
            <Controller
              control={control}
              name="statusId"
              render={({ field }) => (
                <Select
                  disabled={isPending}
                  value={field.value?.toString() ?? ''}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <SelectTrigger
                    aria-invalid={!!statusIdError}
                    aria-describedby={
                      statusIdError ? errorId('statusId') : undefined
                    }
                  >
                    <SelectValue placeholder="Elige un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {refs.statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {statusIdError && (
              <FieldError id={errorId('statusId')}>{statusIdError}</FieldError>
            )}
          </Field>
        </FieldSet>

        <FieldSet className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field data-invalid={!!spotsError}>
            <FieldLabel htmlFor={fieldId('spots')}>
              {AGREEMENT_FIELDS.spots.label}
            </FieldLabel>
            <Input
              id={fieldId('spots')}
              type="number"
              disabled={isPending}
              aria-invalid={!!spotsError}
              aria-describedby={spotsError ? errorId('spots') : undefined}
              {...register('spots', {
                setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)),
              })}
            />
            {spotsError && (
              <FieldError id={errorId('spots')}>{spotsError}</FieldError>
            )}
          </Field>

          {/* Link */}
          <Field data-invalid={!!linkError}>
            <FieldLabel htmlFor={fieldId('link')}>
              {AGREEMENT_FIELDS.link.label}
            </FieldLabel>
            <Input
              id={fieldId('link')}
              type="url"
              disabled={isPending}
              aria-invalid={!!linkError}
              aria-describedby={linkError ? errorId('link') : undefined}
              {...register('link_convenio', {
                setValueAs: (v) => (v === '' ? undefined : v),
              })}
            />
            {linkError && (
              <FieldError id={errorId('link')}>{linkError}</FieldError>
            )}
          </Field>
        </FieldSet>

        <FieldSet className="grid grid-cols-1 gap-4">
          <Field data-invalid={!!attrIdsError}>
            <FieldLabel htmlFor={fieldId('attrIds')}>
              {AGREEMENT_FIELDS.attrIds.label}
              {AGREEMENT_FIELDS.attrIds.required && (
                <span aria-hidden className="text-destructive ml-0.5">
                  *
                </span>
              )}
            </FieldLabel>
            <Controller
              control={control}
              name="attrIds"
              render={({ field }) => (
                <Combobox
                  multiple
                  autoHighlight
                  items={refs.attrs}
                  itemToStringValue={(attr: (typeof refs.attrs)[number]) =>
                    attr.value
                  }
                  id={fieldId('attrIds')}
                  disabled={isPending}
                  aria-invalid={!!attrIdsError}
                  aria-describedby={
                    attrIdsError ? errorId('attrIds') : undefined
                  }
                  // 👇 1. Strictly map the selected values into an array
                  value={refs.attrs.filter((a) => field.value?.includes(a.id))}
                  onValueChange={(newObjects) => {
                    const newIds = newObjects.map((obj) => obj.id);
                    if (
                      JSON.stringify(field.value) !== JSON.stringify(newIds)
                    ) {
                      field.onChange(newIds);
                    }
                  }}
                >
                  <ComboboxChips ref={attrAnchor} className="mt-2 w-full">
                    <ComboboxValue>
                      {(values: typeof refs.attrs) => (
                        <React.Fragment>
                          {values?.map((item) => (
                            <ComboboxChip key={item.id}>
                              {item.value}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput
                            disabled={isPending}
                            placeholder="Seleccionar atributos..."
                          />
                        </React.Fragment>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent
                    anchor={attrAnchor}
                    className="pointer-events-auto"
                    onPointerDown={(e) => e.preventDefault()}
                  >
                    <ComboboxEmpty>No se encontraron atributos.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item.id} value={item}>
                          {item.value}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
            />
            {attrIdsError && (
              <FieldError id={errorId('attrIds')}>{attrIdsError}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!beneficiaryIdsError}>
            <FieldLabel htmlFor={fieldId('beneficiaryIds')}>
              {AGREEMENT_FIELDS.beneficiaryIds.label}
              {AGREEMENT_FIELDS.beneficiaryIds.required && (
                <span aria-hidden className="text-destructive ml-0.5">
                  *
                </span>
              )}
            </FieldLabel>
            <Controller
              control={control}
              name="beneficiaryIds"
              render={({ field }) => (
                <Combobox
                  multiple
                  autoHighlight
                  items={refs.beneficiaries}
                  itemToStringValue={(
                    attr: (typeof refs.beneficiaries)[number]
                  ) => attr.value}
                  id={fieldId('beneficiaryIds')}
                  disabled={isPending}
                  aria-invalid={!!beneficiaryIdsError}
                  aria-describedby={
                    beneficiaryIdsError ? errorId('beneficiaryIds') : undefined
                  }
                  value={refs.beneficiaries.filter((b) =>
                    field.value?.includes(b.id)
                  )}
                  onValueChange={(newObjects) => {
                    const newIds = newObjects.map((obj) => obj.id);
                    // 👇 2. Break the loop! Compare arrays before updating
                    if (
                      JSON.stringify(field.value) !== JSON.stringify(newIds)
                    ) {
                      field.onChange(newIds);
                    }
                  }}
                >
                  <ComboboxChips ref={benAnchor} className="mt-2 w-full">
                    <ComboboxValue>
                      {(values: typeof refs.beneficiaries) => (
                        <React.Fragment>
                          {values?.map((item) => (
                            <ComboboxChip key={item.id}>
                              {item.value}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput
                            disabled={isPending}
                            placeholder="Seleccionar beneficiarios..."
                          />
                        </React.Fragment>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent
                    anchor={benAnchor}
                    className="pointer-events-auto"
                    onPointerDown={(e) => e.preventDefault()}
                  >
                    <ComboboxEmpty>
                      No se encontraron beneficiarios.
                    </ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item.id} value={item}>
                          {item.value}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
            />
          </Field>
          {beneficiaryIdsError && (
            <FieldError id={errorId('beneficiaryIds')}>
              {beneficiaryIdsError}
            </FieldError>
          )}
        </FieldSet>
      </FieldGroup>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isPending}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? (
            <>
              <Spinner data-icon="inline-start" /> Editando...
            </>
          ) : (
            'Editar'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
