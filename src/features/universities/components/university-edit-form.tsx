'use client';

import { startTransition, useActionState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import {
  univeristySchema,
  UNIVERSITY_FIELDS,
  UniversityFields,
  UniversityInput,
} from '../schemas';
import { updateUniversityAction, UniversityActionState } from '../actions';
import type { UniversityDTO } from '@/features/universities/db';
import type { AllRefs } from '@/features/refs/db';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { zodResolver } from '@hookform/resolvers/zod';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const fieldId = (field: UniversityFields) =>
  `edit-university-${field}` as const;
const errorId = (field: UniversityFields) =>
  `edit-university-${field}-error` as const;

interface UniversityEditFormProps {
  university: UniversityDTO;
  refs: AllRefs;
  onCancel: () => void;
}

export function UniversityEditForm({
  university,
  refs,
  onCancel,
}: UniversityEditFormProps) {
  const boundAction = useMemo(
    () => updateUniversityAction.bind(null, university.slug),
    [university.slug]
  );

  const [state, dispatch, isPending] = useActionState<
    UniversityActionState,
    FormData
  >(boundAction, null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors: clientErrors },
  } = useForm<UniversityInput>({
    resolver: zodResolver(univeristySchema),
    mode: 'onBlur',
    // 2. Map the DB university object into the Zod schema's expectations
    defaultValues: {
      name: university.name,
      webPage: university.web_page ?? '',
      start: university.start
        ? new Date(university.start)
        : (undefined as unknown as Date),
      expires: university.expires ? new Date(university.expires) : undefined,
      isCatholic: university.isCatholic,
      city: university.city ?? '',
      address: university.address ?? '',
      regionId: university.regionId,
      countryId: university.countryId,
      institutionTypeId: university.institutionTypeId,
      campusId: university.campusId,
      utilizationId: university.utilizationId,
    },
  });

  useEffect(() => {
    if (!state) return;
    switch (state.type) {
      case 'validation':
        break; // Inline errors
      case 'error':
        toast.error(state.message);
        break;
      case 'success':
        toast.success(state.message);
        onCancel(); // Close form/modal on success
        break;
    }
  }, [state, onCancel]);

  function onSubmit(data: UniversityInput) {
    const formData = new FormData();
    const set = (
      key: UniversityFields,
      value: string | number | boolean | undefined | null
    ) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.set(key, String(value));
      }
    };

    set('name', data.name);
    if (data.start) set('start', data.start.toISOString());
    if (data.expires) set('expires', data.expires.toISOString());
    set('isCatholic', data.isCatholic);
    set('webPage', data.webPage || '');
    set('city', data.city || '');
    set('address', data.address || '');
    set('regionId', data.regionId);
    set('countryId', data.countryId);
    set('institutionTypeId', data.institutionTypeId);
    set('campusId', data.campusId);
    set('utilizationId', data.utilizationId);

    startTransition(() => dispatch(formData));
  }

  const serverErrors = state?.type === 'validation' ? state.errors : undefined;

  // Merge Client & Server Errors
  const nameError = clientErrors.name?.message ?? serverErrors?.name?.[0];
  const startError = clientErrors.start?.message ?? serverErrors?.start?.[0];
  const expiresError =
    clientErrors.expires?.message ?? serverErrors?.expires?.[0];
  const isCatholicError =
    clientErrors.isCatholic?.message ?? serverErrors?.isCatholic?.[0];
  const webPageError =
    clientErrors.webPage?.message ?? serverErrors?.webPage?.[0];
  const addressError =
    clientErrors.address?.message ?? serverErrors?.address?.[0];
  const cityError = clientErrors.city?.message ?? serverErrors?.city?.[0];
  const regionIdError =
    clientErrors.regionId?.message ?? serverErrors?.regionId?.[0];
  const countryIdError =
    clientErrors.countryId?.message ?? serverErrors?.countryId?.[0];
  const institutionTypeIdError =
    clientErrors.institutionTypeId?.message ??
    serverErrors?.institutionTypeId?.[0];
  const campusIdError =
    clientErrors.campusId?.message ?? serverErrors?.campusId?.[0];
  const utilizationIdError =
    clientErrors.utilizationId?.message ?? serverErrors?.utilizationId?.[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {state?.type === 'error' && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {/* ── Información básica ── */}
      <FieldSet>
        <FieldLegend>Información básica</FieldLegend>
        <FieldGroup>
          <Field data-invalid={!!nameError}>
            <FieldLabel htmlFor={fieldId('name')}>
              {UNIVERSITY_FIELDS.name.label}
              {UNIVERSITY_FIELDS.name.required && (
                <span aria-hidden className="text-destructive ml-0.5">
                  *
                </span>
              )}
            </FieldLabel>
            <Input
              id={fieldId('name')}
              disabled={isPending}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? errorId('name') : undefined}
              {...register('name')}
            />
            {nameError && (
              <FieldError id={errorId('name')}>{nameError}</FieldError>
            )}
          </Field>

          <FieldSeparator />

          <Field data-invalid={!!webPageError}>
            <FieldLabel htmlFor={fieldId('webPage')}>
              {UNIVERSITY_FIELDS.webPage.label}
            </FieldLabel>
            <Input
              id={fieldId('webPage')}
              placeholder="https://"
              disabled={isPending}
              aria-invalid={!!webPageError}
              aria-describedby={webPageError ? errorId('webPage') : undefined}
              {...register('webPage')}
            />
            {webPageError && (
              <FieldError id={errorId('webPage')}>{webPageError}</FieldError>
            )}
          </Field>

          <FieldSeparator />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={!!institutionTypeIdError}>
              <FieldLabel>
                {UNIVERSITY_FIELDS.institutionTypeId.label}
                {UNIVERSITY_FIELDS.institutionTypeId.required && (
                  <span aria-hidden className="text-destructive ml-0.5">
                    *
                  </span>
                )}
              </FieldLabel>
              <Controller
                control={control}
                name="institutionTypeId"
                render={({ field }) => (
                  <Select
                    disabled={isPending}
                    value={field.value ? field.value.toString() : undefined}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <SelectTrigger
                      aria-invalid={!!institutionTypeIdError}
                      aria-describedby={
                        institutionTypeIdError
                          ? errorId('institutionTypeId')
                          : undefined
                      }
                    >
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      {refs.institutionTypes
                        .filter((r) => r.id !== 0)
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.value}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {institutionTypeIdError && (
                <FieldError id={errorId('institutionTypeId')}>
                  {institutionTypeIdError}
                </FieldError>
              )}
            </Field>

            <Field data-invalid={!!campusIdError}>
              <FieldLabel>
                {UNIVERSITY_FIELDS.campusId.label}
                {UNIVERSITY_FIELDS.campusId.required && (
                  <span aria-hidden className="text-destructive ml-0.5">
                    *
                  </span>
                )}
              </FieldLabel>
              <Controller
                control={control}
                name="campusId"
                render={({ field }) => (
                  <Select
                    disabled={isPending}
                    value={field.value ? field.value.toString() : undefined}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <SelectTrigger
                      aria-invalid={!!campusIdError}
                      aria-describedby={
                        campusIdError ? errorId('campusId') : undefined
                      }
                    >
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      {refs.campuses
                        .filter((r) => r.id !== 0)
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.value}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {campusIdError && (
                <FieldError id={errorId('campusId')}>
                  {campusIdError}
                </FieldError>
              )}
            </Field>
          </div>

          <FieldSeparator />

          <Field data-invalid={!!utilizationIdError}>
            <FieldLabel>
              {UNIVERSITY_FIELDS.utilizationId.label}
              {UNIVERSITY_FIELDS.utilizationId.required && (
                <span aria-hidden className="text-destructive ml-0.5">
                  *
                </span>
              )}
            </FieldLabel>
            <Controller
              control={control}
              name="utilizationId"
              render={({ field }) => (
                <Select
                  disabled={isPending}
                  value={field.value ? field.value.toString() : undefined}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <SelectTrigger
                    aria-invalid={!!utilizationIdError}
                    aria-describedby={
                      utilizationIdError ? errorId('utilizationId') : undefined
                    }
                  >
                    <SelectValue placeholder="Seleccionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    {refs.utilizations
                      .filter((r) => r.id !== 0)
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.value}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            {utilizationIdError && (
              <FieldError id={errorId('utilizationId')}>
                {utilizationIdError}
              </FieldError>
            )}
          </Field>

          <FieldSeparator />

          <Field orientation="horizontal" data-invalid={!!isCatholicError}>
            <Controller
              control={control}
              name="isCatholic"
              render={({ field }) => (
                <Checkbox
                  id={fieldId('isCatholic')}
                  disabled={isPending}
                  checked={!!field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  aria-invalid={!!isCatholicError}
                  aria-describedby={
                    isCatholicError ? errorId('isCatholic') : undefined
                  }
                />
              )}
            />
            <FieldContent>
              <FieldLabel htmlFor={fieldId('isCatholic')}>
                {UNIVERSITY_FIELDS.isCatholic.label}
              </FieldLabel>
              <FieldDescription>
                Afiliación católica de la institución.
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      {/* ── Ubicación ── */}
      <FieldSet>
        <FieldLegend>Ubicación</FieldLegend>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={!!regionIdError}>
              <FieldLabel>
                {UNIVERSITY_FIELDS.regionId.label}
                {UNIVERSITY_FIELDS.regionId.required && (
                  <span aria-hidden className="text-destructive ml-0.5">
                    *
                  </span>
                )}
              </FieldLabel>
              <Controller
                control={control}
                name="regionId"
                render={({ field }) => (
                  <Select
                    disabled={isPending}
                    value={field.value ? field.value.toString() : undefined}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <SelectTrigger
                      aria-invalid={!!regionIdError}
                      aria-describedby={
                        regionIdError ? errorId('regionId') : undefined
                      }
                    >
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      {refs.regions
                        .filter((r) => r.id !== 0)
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.value}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {regionIdError && (
                <FieldError id={errorId('regionId')}>
                  {regionIdError}
                </FieldError>
              )}
            </Field>

            <Field data-invalid={!!countryIdError}>
              <FieldLabel>
                {UNIVERSITY_FIELDS.countryId.label}
                {UNIVERSITY_FIELDS.countryId.required && (
                  <span aria-hidden className="text-destructive ml-0.5">
                    *
                  </span>
                )}
              </FieldLabel>
              <Controller
                control={control}
                name="countryId"
                render={({ field }) => (
                  <Select
                    disabled={isPending}
                    value={field.value ? field.value.toString() : undefined}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <SelectTrigger
                      aria-invalid={!!countryIdError}
                      aria-describedby={
                        countryIdError ? errorId('countryId') : undefined
                      }
                    >
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      {refs.countries
                        .filter((r) => r.id !== 0)
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.value}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {countryIdError && (
                <FieldError id={errorId('countryId')}>
                  {countryIdError}
                </FieldError>
              )}
            </Field>
          </div>

          <FieldSeparator />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={!!cityError}>
              <FieldLabel htmlFor={fieldId('city')}>
                {UNIVERSITY_FIELDS.city.label}
              </FieldLabel>
              <Input
                id={fieldId('city')}
                disabled={isPending}
                placeholder="Madrid"
                aria-invalid={!!cityError}
                aria-describedby={cityError ? errorId('city') : undefined}
                {...register('city')}
              />
              {cityError && (
                <FieldError id={errorId('city')}>{cityError}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!addressError}>
              <FieldLabel htmlFor={fieldId('address')}>
                {UNIVERSITY_FIELDS.address.label}
              </FieldLabel>
              <Input
                id={fieldId('address')}
                disabled={isPending}
                aria-invalid={!!addressError}
                aria-describedby={addressError ? errorId('address') : undefined}
                {...register('address')}
              />
              {addressError && (
                <FieldError id={errorId('address')}>{addressError}</FieldError>
              )}
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>

      {/* ── Vigencia ── */}
      <FieldSet>
        <FieldLegend>Vigencia</FieldLegend>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={!!startError} className="flex flex-col gap-2">
              <FieldLabel htmlFor={fieldId('start')}>
                {UNIVERSITY_FIELDS.start.label}
                {UNIVERSITY_FIELDS.start.required && (
                  <span aria-hidden className="text-destructive ml-0.5">
                    *
                  </span>
                )}
              </FieldLabel>
              <Controller
                control={control}
                name="start"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id={fieldId('start')}
                        variant="outline"
                        type="button"
                        disabled={isPending}
                        aria-invalid={!!startError}
                        aria-describedby={
                          startError ? errorId('start') : undefined
                        }
                        data-empty={!field.value}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          'data-[empty=true]:text-muted-foreground'
                        )}
                      >
                        <CalendarIcon />
                        {field.value ? (
                          format(field.value, 'PPP', { locale: es })
                        ) : (
                          <span>Elige una fecha de inicio</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {startError && (
                <FieldError id={errorId('start')}>{startError}</FieldError>
              )}
            </Field>

            <Field
              data-invalid={!!expiresError}
              className="flex flex-col gap-2"
            >
              <FieldLabel htmlFor={fieldId('expires')}>
                {UNIVERSITY_FIELDS.expires.label}
                {UNIVERSITY_FIELDS.expires.required && (
                  <span aria-hidden className="text-destructive ml-0.5">
                    *
                  </span>
                )}
              </FieldLabel>
              <Controller
                control={control}
                name="expires"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id={fieldId('expires')}
                        variant="outline"
                        type="button"
                        disabled={isPending}
                        aria-invalid={!!expiresError}
                        aria-describedby={
                          expiresError ? errorId('expires') : undefined
                        }
                        data-empty={!field.value}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          'data-[empty=true]:text-muted-foreground'
                        )}
                      >
                        <CalendarIcon />
                        {field.value ? (
                          format(field.value, 'PPP', { locale: es })
                        ) : (
                          <span>Vacío si es indefinida</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {expiresError && (
                <FieldError id={errorId('expires')}>{expiresError}</FieldError>
              )}
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isPending ? (
            <>
              <Spinner data-icon="inline-start" className="mr-2" />
              Guardando…
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </form>
  );
}
