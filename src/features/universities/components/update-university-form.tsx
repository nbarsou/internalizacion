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
  FieldSet,
} from '@/components/ui/field';
import {
  univeristySchema,
  UNIVERSITY_FIELDS,
  UniversityFields,
  UniversityInput,
} from '../schemas';
import { updateUniversityAction, UniversityActionResult } from '../actions';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fieldId = (field: UniversityFields) =>
  `edit-university-${field}` as const;
const errorId = (field: UniversityFields) =>
  `edit-university-${field}-error` as const;

// ── Component ─────────────────────────────────────────────────────────────────

interface UpdateUniversityFormProps {
  university: UniversityDTO;
  refs: AllRefs;
}

export function UpdateUniversityForm({
  university,
  refs,
}: UpdateUniversityFormProps) {
  const router = useRouter();

  const boundAction = useMemo(
    () => updateUniversityAction.bind(null, university.slug),
    [university.slug]
  );

  const [state, dispatch, isPending] = useActionState<
    UniversityActionResult,
    UniversityInput
  >(boundAction, null);

  const defaultFormValues = useMemo<UniversityInput>(
    () => ({
      name: university.name,
      webPage: university.web_page ?? undefined,
      start: new Date(university.start),
      expires: university.expires ? new Date(university.expires) : undefined,
      isCatholic: university.isCatholic,
      city: university.city ?? undefined,
      address: university.address ?? undefined,
      regionId: university.regionId,
      countryId: university.countryId,
      institutionTypeId: university.institutionTypeId,
      campusId: university.campusId,
      utilizationId: university.utilizationId,
    }),
    [university]
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors: clientErrors, isDirty },
  } = useForm<UniversityInput>({
    resolver: zodResolver(univeristySchema),
    mode: 'onBlur',
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (!state) return;
    switch (state.type) {
      case 'error':
        toast.error(state.message);
        break;
      case 'success':
        toast.success(state.message);
        router.push(`/universities/${university.slug}`);
        break;
    }
  }, [state, router, university.slug]);

  function onSubmit(data: UniversityInput) {
    startTransition(() => dispatch(data));
  }

  const serverErrors = state?.type === 'validation' ? state.errors : undefined;

  // Merge client + server errors
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Editar institución</CardTitle>
          <CardDescription>
            Actualiza los datos de{' '}
            <span className="font-medium">{university.name}</span>. Los campos
            marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <FieldGroup className="gap-6">
            {/* ── Identity ── */}
            <FieldSet>
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
                <FieldDescription>El nombre de la institución</FieldDescription>
                {nameError && (
                  <FieldError id={errorId('name')}>{nameError}</FieldError>
                )}
              </Field>

              {/* Start date */}
              <Field
                data-invalid={!!startError}
                className="flex flex-col gap-2"
              >
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
                          disabled={isPending}
                          required
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {startError && (
                  <FieldError id={errorId('start')}>{startError}</FieldError>
                )}
              </Field>

              {/* Expires date */}
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
                          onChange={(date) => {
                            field.onChange(date ?? undefined);
                          }}
                        >
                          <CalendarIcon />
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Elige una fecha de expiración</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={isPending}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {expiresError && (
                  <FieldError id={errorId('expires')}>
                    {expiresError}
                  </FieldError>
                )}
              </Field>

              {/* Is Catholic */}
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
                    {UNIVERSITY_FIELDS.isCatholic.required && (
                      <span aria-hidden className="text-destructive ml-0.5">
                        *
                      </span>
                    )}
                  </FieldLabel>
                </FieldContent>
              </Field>
            </FieldSet>

            {/* ── Web ── */}
            <FieldSet>
              <Field data-invalid={!!webPageError}>
                <FieldLabel htmlFor={fieldId('webPage')}>
                  {UNIVERSITY_FIELDS.webPage.label}
                  {UNIVERSITY_FIELDS.webPage.required && (
                    <span aria-hidden className="text-destructive ml-0.5">
                      *
                    </span>
                  )}
                </FieldLabel>
                <Input
                  id={fieldId('webPage')}
                  disabled={isPending}
                  aria-invalid={!!webPageError}
                  aria-describedby={
                    webPageError ? errorId('webPage') : undefined
                  }
                  {...register('webPage', {
                    setValueAs: (v) => (v === '' ? undefined : v),
                  })}
                />
                <FieldDescription>
                  URL del sitio web de la institución
                </FieldDescription>
                {webPageError && (
                  <FieldError id={errorId('webPage')}>
                    {webPageError}
                  </FieldError>
                )}
              </Field>
            </FieldSet>

            {/* ── Location ── */}
            <FieldSet className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field data-invalid={!!regionIdError}>
                <FieldLabel htmlFor={fieldId('regionId')}>
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
                      value={field.value?.toString() ?? ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger
                        id={fieldId('regionId')}
                        aria-invalid={!!regionIdError}
                        aria-describedby={
                          regionIdError ? errorId('regionId') : undefined
                        }
                      >
                        <SelectValue placeholder="Elige una región" />
                      </SelectTrigger>
                      <SelectContent>
                        {refs.regions.map((r) => (
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
                <FieldLabel htmlFor={fieldId('countryId')}>
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
                      value={field.value?.toString() ?? ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger
                        id={fieldId('countryId')}
                        aria-invalid={!!countryIdError}
                        aria-describedby={
                          countryIdError ? errorId('countryId') : undefined
                        }
                      >
                        <SelectValue placeholder="Elige un país" />
                      </SelectTrigger>
                      <SelectContent>
                        {refs.countries.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.value}
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

              <Field data-invalid={!!cityError}>
                <FieldLabel htmlFor={fieldId('city')}>
                  {UNIVERSITY_FIELDS.city.label}
                  {UNIVERSITY_FIELDS.city.required && (
                    <span aria-hidden className="text-destructive ml-0.5">
                      *
                    </span>
                  )}
                </FieldLabel>
                <Input
                  id={fieldId('city')}
                  disabled={isPending}
                  aria-invalid={!!cityError}
                  aria-describedby={cityError ? errorId('city') : undefined}
                  {...register('city')}
                />
                <FieldDescription>
                  La ciudad donde se encuentra la institución
                </FieldDescription>
                {cityError && (
                  <FieldError id={errorId('city')}>{cityError}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!addressError}>
                <FieldLabel htmlFor={fieldId('address')}>
                  {UNIVERSITY_FIELDS.address.label}
                  {UNIVERSITY_FIELDS.address.required && (
                    <span aria-hidden className="text-destructive ml-0.5">
                      *
                    </span>
                  )}
                </FieldLabel>
                <Input
                  id={fieldId('address')}
                  disabled={isPending}
                  aria-invalid={!!addressError}
                  aria-describedby={
                    addressError ? errorId('address') : undefined
                  }
                  {...register('address')}
                />
                <FieldDescription>
                  La dirección de la universidad
                </FieldDescription>
                {addressError && (
                  <FieldError id={errorId('address')}>
                    {addressError}
                  </FieldError>
                )}
              </Field>
            </FieldSet>

            {/* ── Classification ── */}
            <FieldSet>
              <Field data-invalid={!!institutionTypeIdError}>
                <FieldLabel htmlFor={fieldId('institutionTypeId')}>
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
                      value={field.value?.toString() ?? ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger
                        id={fieldId('institutionTypeId')}
                        aria-invalid={!!institutionTypeIdError}
                        aria-describedby={
                          institutionTypeIdError
                            ? errorId('institutionTypeId')
                            : undefined
                        }
                      >
                        <SelectValue placeholder="Elige un tipo de institución" />
                      </SelectTrigger>
                      <SelectContent>
                        {refs.institutionTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.value}
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
                <FieldLabel htmlFor={fieldId('campusId')}>
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
                      value={field.value?.toString() ?? ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger
                        id={fieldId('campusId')}
                        aria-invalid={!!campusIdError}
                        aria-describedby={
                          campusIdError ? errorId('campusId') : undefined
                        }
                      >
                        <SelectValue placeholder="Elige un campus" />
                      </SelectTrigger>
                      <SelectContent>
                        {refs.campuses.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.value}
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

              <Field data-invalid={!!utilizationIdError}>
                <FieldLabel htmlFor={fieldId('utilizationId')}>
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
                      value={field.value?.toString() ?? ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger
                        id={fieldId('utilizationId')}
                        aria-invalid={!!utilizationIdError}
                        aria-describedby={
                          utilizationIdError
                            ? errorId('utilizationId')
                            : undefined
                        }
                      >
                        <SelectValue placeholder="Elige un nivel de utilización" />
                      </SelectTrigger>
                      <SelectContent>
                        {refs.utilizations.map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.value}
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
            </FieldSet>
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending || !isDirty}
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
        </CardFooter>
      </Card>
    </form>
  );
}
