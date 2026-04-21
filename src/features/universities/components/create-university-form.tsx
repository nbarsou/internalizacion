'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { createUniversitySchema, type CreateUniversityInput } from '../schemas';
import { actionCreateUniversity } from '../actions';
import type { AllRefs } from '@/features/refs/db';

// ── Raw form values ───────────────────────────────────────────────────────────
// react-hook-form works with raw HTML values (selects return strings).
// We validate and coerce to CreateUniversityInput manually via Zod in onSubmit.

interface RawFormValues {
  name: string;
  pagina_web: string;
  start: string;
  expires: string;
  isCatholic: boolean;
  city: string;
  address: string;
  regionId: string; // select returns string
  countryId: string;
  institutionTypeId: string;
  campusId: string;
  utilizationId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CreateUniversityFormProps {
  refs: AllRefs;
}

export function CreateUniversityForm({ refs }: CreateUniversityFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RawFormValues>({
    defaultValues: {
      name: '',
      pagina_web: '',
      start: '',
      expires: '',
      isCatholic: false,
      city: '',
      address: '',
      regionId: '',
      countryId: '',
      institutionTypeId: '',
      campusId: '',
      utilizationId: '',
    },
  });

  function onSubmit(raw: RawFormValues) {
    // Coerce select strings to numbers then validate with Zod
    const coerced = {
      ...raw,
      regionId: raw.regionId ? parseInt(raw.regionId) : undefined,
      countryId: raw.countryId ? parseInt(raw.countryId) : undefined,
      institutionTypeId: raw.institutionTypeId
        ? parseInt(raw.institutionTypeId)
        : undefined,
      campusId: raw.campusId ? parseInt(raw.campusId) : undefined,
      utilizationId: raw.utilizationId
        ? parseInt(raw.utilizationId)
        : undefined,
    };

    const parsed = createUniversitySchema.safeParse(coerced);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = (issue.path[0] as string | undefined) ?? 'root';
        setError(field as keyof RawFormValues, {
          type: 'zod',
          message: issue.message,
        });
      }
      return;
    }

    startTransition(async () => {
      const result = await actionCreateUniversity(
        parsed.data as CreateUniversityInput
      );

      if (result.success) {
        router.push(`/universities/${result.slug}`);
        return;
      }

      for (const [field, message] of Object.entries(result.fieldErrors)) {
        if (!message) continue;
        setError(field as keyof RawFormValues, { type: 'server', message });
      }
      if (result.formError) {
        setError('root', { message: result.formError });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      {/* Root error */}
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      {/* ── Información básica ── */}
      <FieldSet>
        <FieldLegend>Información básica</FieldLegend>
        <FieldDescription>
          Nombre, sitio web y clasificación institucional.
        </FieldDescription>

        <FieldGroup>
          {/* Name */}
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="name"
              placeholder="Universidad de Ejemplo"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <FieldSeparator />

          {/* Website */}
          <Field data-invalid={!!errors.pagina_web}>
            <FieldLabel htmlFor="pagina_web">Sitio web</FieldLabel>
            <Input
              id="pagina_web"
              placeholder="https://www.ejemplo.edu"
              aria-invalid={!!errors.pagina_web}
              {...register('pagina_web')}
            />
            <FieldDescription>Incluye https:// al inicio.</FieldDescription>
            <FieldError errors={[errors.pagina_web]} />
          </Field>

          <FieldSeparator />

          {/* Institution type + Campus side by side */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.institutionTypeId}>
              <FieldLabel>
                Tipo de institución <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="institutionTypeId"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString() ?? ''}
                  >
                    <SelectTrigger aria-invalid={!!errors.institutionTypeId}>
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      {refs.institutionTypes
                        .filter((r) => r.id !== 0)
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.institutionTypeId]} />
            </Field>

            <Field data-invalid={!!errors.campusId}>
              <FieldLabel>
                Campus Anáhuac titular{' '}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="campusId"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString() ?? ''}
                  >
                    <SelectTrigger aria-invalid={!!errors.campusId}>
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      {refs.campuses
                        .filter((r) => r.id !== 0)
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.campusId]} />
            </Field>
          </div>

          <FieldSeparator />

          {/* Utilization */}
          <Field data-invalid={!!errors.utilizationId}>
            <FieldLabel>
              Utilización <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              control={control}
              name="utilizationId"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value?.toString() ?? ''}
                >
                  <SelectTrigger aria-invalid={!!errors.utilizationId}>
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
            <FieldError errors={[errors.utilizationId]} />
          </Field>

          <FieldSeparator />

          {/* Catholic — horizontal orientation */}
          <Field orientation="horizontal">
            <Controller
              control={control}
              name="isCatholic"
              render={({ field }) => (
                <Checkbox
                  id="isCatholic"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FieldContent>
              <FieldLabel htmlFor="isCatholic">Universidad católica</FieldLabel>
              <FieldDescription>
                Marca si la institución es de afiliación católica.
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      {/* ── Ubicación ── */}
      <FieldSet>
        <FieldLegend>Ubicación</FieldLegend>
        <FieldDescription>Región, país y datos de dirección.</FieldDescription>

        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Region */}
            <Field data-invalid={!!errors.regionId}>
              <FieldLabel>
                Región <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="regionId"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString() ?? ''}
                  >
                    <SelectTrigger aria-invalid={!!errors.regionId}>
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      {refs.regions
                        .filter((r) => r.id !== 0)
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.regionId]} />
            </Field>

            {/* Country */}
            <Field data-invalid={!!errors.countryId}>
              <FieldLabel>
                País <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="countryId"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString() ?? ''}
                  >
                    <SelectTrigger aria-invalid={!!errors.countryId}>
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      {refs.countries
                        .filter((r) => r.id !== 0)
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.countryId]} />
            </Field>
          </div>

          <FieldSeparator />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* City */}
            <Field data-invalid={!!errors.city}>
              <FieldLabel htmlFor="city">Ciudad</FieldLabel>
              <Input id="city" placeholder="Madrid" {...register('city')} />
              <FieldError errors={[errors.city]} />
            </Field>

            {/* Address */}
            <Field data-invalid={!!errors.address}>
              <FieldLabel htmlFor="address">Dirección</FieldLabel>
              <Input
                id="address"
                placeholder="Calle Ejemplo 123"
                {...register('address')}
              />
              <FieldError errors={[errors.address]} />
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>

      {/* ── Vigencia ── */}
      <FieldSet>
        <FieldLegend>Vigencia de la relación</FieldLegend>
        <FieldDescription>
          Inicio de la relación institucional y fecha de vencimiento si aplica.
        </FieldDescription>

        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Start */}
            <Field data-invalid={!!errors.start}>
              <FieldLabel htmlFor="start">
                Fecha de inicio <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="start"
                type="date"
                aria-invalid={!!errors.start}
                {...register('start')}
              />
              <FieldError errors={[errors.start]} />
            </Field>

            {/* Expires */}
            <Field data-invalid={!!errors.expires}>
              <FieldLabel htmlFor="expires">Vigencia hasta</FieldLabel>
              <Input
                id="expires"
                type="date"
                aria-invalid={!!errors.expires}
                {...register('expires')}
              />
              <FieldDescription>
                Dejar vacío si la relación es indefinida.
              </FieldDescription>
              <FieldError errors={[errors.expires]} />
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between border-t pt-6">
        <Button variant="ghost" asChild>
          <Link href="/universities">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar
          </Link>
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Guardando…' : 'Crear institución'}
        </Button>
      </div>
    </form>
  );
}
