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

import { createAgreementAction, type AgreementActionResult } from '../actions';
import {
  agreementSchema,
  AGREEMENT_FIELDS,
  type AgreementFields,
  type AgreementInput,
} from '../schemas';
import { AllRefs } from '@/features/refs/db';

const fieldId = (field: AgreementFields) =>
  `create-agreement-${field}` as const;
const errorId = (field: AgreementFields) =>
  `create-agreement-${field}-error` as const;

// ── Modal wrapper ─────────────────────────────────────────────────────────────

interface CreateAgreementModalProps {
  universityId: string;
  universitySlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refs: AllRefs;
}

export function CreateAgreementModal({
  universityId,
  universitySlug,
  open,
  onOpenChange,
  refs,
}: CreateAgreementModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Convenio</DialogTitle>
          <DialogDescription>
            Registra un nuevo convenio. Los campos con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <CreateAgreementForm
            universityId={universityId}
            universitySlug={universitySlug}
            refs={refs}
            onSuccess={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Inner form ────────────────────────────────────────────────────────────────

interface CreateAgreementFormProps {
  universityId: string;
  universitySlug: string;
  refs: AllRefs;
  onSuccess: () => void;
}

function CreateAgreementForm({
  universityId,
  universitySlug,
  refs,
  onSuccess,
}: CreateAgreementFormProps) {
  const typeAnchor = useComboboxAnchor();
  const attrAnchor = useComboboxAnchor();
  const benAnchor = useComboboxAnchor();

  const boundAction = useMemo(
    () => createAgreementAction.bind(null, universityId, universitySlug),
    [universityId, universitySlug]
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
    formState: { errors: clientErrors },
  } = useForm<AgreementInput>({
    resolver: zodResolver(agreementSchema),
    mode: 'onBlur',
    defaultValues: {
      typeId: undefined,
      statusId: undefined,
      spots: undefined,
      link_convenio: '',
      attrIds: [],
      beneficiaryIds: [],
    },
  });

  useEffect(() => {
    if (!state) return;
    switch (state.type) {
      case 'error':
        toast.error(state.message);
        break;
      case 'success':
        toast.success(state.message || 'Convenio creado con éxito.');
        onSuccess();
        break;
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
                    type: (typeof refs.agreementTypes)[number]
                  ) => type.value}
                  id={fieldId('typeId')}
                  disabled={isPending}
                  aria-invalid={!!typeIdError}
                  aria-describedby={typeIdError ? errorId('typeId') : undefined}
                  value={
                    refs.agreementTypes.find((t) => t.id === field.value) ??
                    null
                  }
                  onValueChange={(item) =>
                    field.onChange(item?.id ?? undefined)
                  }
                >
                  <ComboboxInput
                    placeholder="Seleccionar tipo..."
                    disabled={isPending}
                  />
                  <ComboboxContent
                    anchor={typeAnchor}
                    className="pointer-events-auto"
                  >
                    <ComboboxEmpty>No se encontraron tipos.</ComboboxEmpty>
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
          {/* Spots */}
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
          {/* Attrs */}
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

          {/* Beneficiaries */}
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
  );
}
