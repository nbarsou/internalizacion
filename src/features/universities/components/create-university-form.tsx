'use client';

import { startTransition, useActionState, useEffect } from 'react';
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
import { createUniversityAction, UniversityActionState } from '../actions';
import type { AllRefs } from '@/features/refs/db';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

const fieldId = (field: UniversityFields) =>
  `create-university-${field}` as const;
const errorId = (field: UniversityFields) =>
  `create-university-${field}-error` as const;
interface CreateUniversityFormProps {
  refs: AllRefs;
}

export function CreateUniversityForm({ refs }: CreateUniversityFormProps) {
  const router = useRouter();

  const [state, dispatch, isPending] = useActionState<
    UniversityActionState,
    FormData
  >(createUniversityAction, null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors: clientErrors },
  } = useForm<UniversityInput>({
    resolver: zodResolver(univeristySchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      webPage: '',
      start: undefined,
      expires: undefined,
      isCatholic: false,
      city: '',
      address: '',
      regionId: undefined,
      countryId: undefined,
      institutionTypeId: undefined,
      campusId: undefined,
      utilizationId: undefined,
    },
  });

  useEffect(() => {
    // 1. Ignore the initial empty state (e.g., when useFormState first mounts)
    if (!state) return;
    switch (state.type) {
      case 'validation':
        // Field errors are shown inline — no toast needed
        break;
      case 'error':
        toast.error(state.message);
        break;
    }
  }, [state]);

  function onSubmit(data: UniversityInput) {
    const formData = new FormData();
    const set = (
      key: UniversityFields,
      value: string | number | boolean | undefined | null
    ) => {
      // 2. ONLY set the value if it actually exists and isn't an empty string
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

  console.log(refs);
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Nueva Institución</CardTitle>
          <CardDescription>
            Registra una nueva universidad o institución partner. Los campos
            marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-6">
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
                  render={({ field }) => {
                    return (
                      <>
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
                      </>
                    );
                  }}
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
                  render={({ field }) => {
                    return (
                      <>
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
                                <span>Elige una fecha de expiración</span>
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
                      </>
                    );
                  }}
                />
                {expiresError && (
                  <FieldError id={errorId('expires')}>
                    {expiresError}
                  </FieldError>
                )}
              </Field>
              <Field orientation="horizontal" data-invalid={!!isCatholicError}>
                <Controller
                  control={control}
                  name="isCatholic"
                  render={({ field }) => (
                    <Checkbox
                      id={fieldId('isCatholic')}
                      disabled={isPending}
                      // Ensure it is strictly a boolean
                      checked={!!field.value}
                      // Intercept the value and force it to be a strict boolean
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
                    {' '}
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
                  {...register('webPage')}
                />
                <FieldDescription>El nombre de la institución</FieldDescription>
                {webPageError && (
                  <FieldError id={errorId('webPage')}>
                    {webPageError}
                  </FieldError>
                )}
              </Field>
            </FieldSet>
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
                  render={({ field }) => {
                    return (
                      <Select
                        disabled={isPending}
                        // 1. Convert form state (number) to string for the Select component
                        // Note: using `.toString()` so we don't pass 'undefined' as a literal string
                        value={field.value ? field.value.toString() : undefined}
                        // 2. Convert Radix's output (string) back to a number for react-hook-form
                        onValueChange={(val) => field.onChange(Number(val))}
                      >
                        <SelectTrigger
                          id={fieldId('regionId')}
                          aria-invalid={!!regionIdError}
                          aria-describedby={
                            regionIdError ? errorId('regionId') : undefined
                          }
                        >
                          {/* Note: I also fixed a small typo here for you ('regionIdo' -> 'país') */}
                          <SelectValue placeholder="Elige una región" />
                        </SelectTrigger>
                        <SelectContent>
                          {refs.regions.map((country) => (
                            // 3. Convert the DB ID (number) to a string for the SelectItem
                            <SelectItem
                              key={country.id}
                              value={country.id.toString()}
                            >
                              {country.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
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
                  render={({ field }) => {
                    return (
                      <Select
                        disabled={isPending}
                        // 1. Convert form state (number) to string for the Select component
                        // Note: using `.toString()` so we don't pass 'undefined' as a literal string
                        value={field.value ? field.value.toString() : undefined}
                        // 2. Convert Radix's output (string) back to a number for react-hook-form
                        onValueChange={(val) => field.onChange(Number(val))}
                      >
                        <SelectTrigger
                          id={fieldId('countryId')}
                          aria-invalid={!!countryIdError}
                          aria-describedby={
                            countryIdError ? errorId('countryId') : undefined
                          }
                        >
                          {/* Note: I also fixed a small typo here for you ('countryIdo' -> 'país') */}
                          <SelectValue placeholder="Elige un país" />
                        </SelectTrigger>
                        <SelectContent>
                          {refs.countries.map((country) => (
                            // 3. Convert the DB ID (number) to a string for the SelectItem
                            <SelectItem
                              key={country.id}
                              value={country.id.toString()}
                            >
                              {country.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
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
                  render={({ field }) => {
                    return (
                      <Select
                        disabled={isPending}
                        // 1. Convert form state (number) to string for the Select component
                        // Note: using `.toString()` so we don't pass 'undefined' as a literal string
                        value={field.value ? field.value.toString() : undefined}
                        // 2. Convert Radix's output (string) back to a number for react-hook-form
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
                          {/* Note: I also fixed a small typo here for you ('institutionTypeIdo' -> 'país') */}
                          <SelectValue placeholder="Elige un tipo de institución" />
                        </SelectTrigger>
                        <SelectContent>
                          {refs.countries.map((country) => (
                            // 3. Convert the DB ID (number) to a string for the SelectItem
                            <SelectItem
                              key={country.id}
                              value={country.id.toString()}
                            >
                              {country.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                {institutionTypeIdError && (
                  <FieldError id={errorId('institutionTypeId')}>
                    {institutionTypeIdError}
                  </FieldError>
                )}
              </Field>
            </FieldSet>
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
                render={({ field }) => {
                  return (
                    <Select
                      disabled={isPending}
                      // 1. Convert form state (number) to string for the Select component
                      // Note: using `.toString()` so we don't pass 'undefined' as a literal string
                      value={field.value ? field.value.toString() : undefined}
                      // 2. Convert Radix's output (string) back to a number for react-hook-form
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger
                        id={fieldId('campusId')}
                        aria-invalid={!!campusIdError}
                        aria-describedby={
                          campusIdError ? errorId('campusId') : undefined
                        }
                      >
                        {/* Note: I also fixed a small typo here for you ('campusIdo' -> 'país') */}
                        <SelectValue placeholder="Elige un campus" />
                      </SelectTrigger>
                      <SelectContent>
                        {refs.countries.map((country) => (
                          // 3. Convert the DB ID (number) to a string for the SelectItem
                          <SelectItem
                            key={country.id}
                            value={country.id.toString()}
                          >
                            {country.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
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
                render={({ field }) => {
                  return (
                    <Select
                      disabled={isPending}
                      // 1. Convert form state (number) to string for the Select component
                      // Note: using `.toString()` so we don't pass 'undefined' as a literal string
                      value={field.value ? field.value.toString() : undefined}
                      // 2. Convert Radix's output (string) back to a number for react-hook-form
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
                        {/* Note: I also fixed a small typo here for you ('utilizationIdo' -> 'país') */}
                        <SelectValue placeholder="Elige un nivel de utilización" />
                      </SelectTrigger>
                      <SelectContent>
                        {refs.countries.map((country) => (
                          // 3. Convert the DB ID (number) to a string for the SelectItem
                          <SelectItem
                            key={country.id}
                            value={country.id.toString()}
                          >
                            {country.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {utilizationIdError && (
                <FieldError id={errorId('utilizationId')}>
                  {utilizationIdError}
                </FieldError>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            variant="ghost"
            type="button"
            disabled={isPending}
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                Creando...
              </>
            ) : (
              'Crear Institución'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
