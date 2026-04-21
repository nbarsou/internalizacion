'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
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
import { createUniversitySchema } from '@/features/universities/schemas';
import { actionUpdateUniversity } from '../actions';
import type { UniversityDetail } from '@/features/universities/db';
import type { AllRefs } from '@/features/refs/db';

// ── Raw form values (selects return strings) ──────────────────────────────────

interface RawFormValues {
  name: string;
  pagina_web: string;
  start: string;
  expires: string;
  isCatholic: boolean;
  city: string;
  address: string;
  regionId: string;
  countryId: string;
  institutionTypeId: string;
  campusId: string;
  utilizationId: string;
}

function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

interface UniversityEditFormProps {
  university: UniversityDetail;
  refs: AllRefs;
  onCancel: () => void;
}

export function UniversityEditForm({
  university,
  refs,
  onCancel,
}: UniversityEditFormProps) {
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
      name: university.name,
      pagina_web: university.pagina_web ?? '',
      start: toDateInput(university.start),
      expires: toDateInput(university.expires),
      isCatholic: university.isCatholic,
      city: university.city ?? '',
      address: university.address ?? '',
      regionId: university.regionId.toString(),
      countryId: university.countryId.toString(),
      institutionTypeId: university.institutionTypeId.toString(),
      campusId: university.campusId.toString(),
      utilizationId: university.utilizationId.toString(),
    },
  });

  function onSubmit(raw: RawFormValues) {
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
      const result = await actionUpdateUniversity(university.id, parsed.data);
      if (result.success) {
        if (result.slug !== university.slug) {
          router.push(`/universities/${result.slug}`);
        } else {
          router.refresh();
          onCancel();
        }
        return;
      }
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        if (!message) continue;
        setError(field as keyof RawFormValues, { type: 'server', message });
      }
      if (result.formError) setError('root', { message: result.formError });
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      {/* ── Información básica ── */}
      <FieldSet>
        <FieldLegend>Información básica</FieldLegend>
        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="eu-name">
              Nombre <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="eu-name"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            <FieldError errors={[errors.name]} />
          </Field>
          <FieldSeparator />
          <Field data-invalid={!!errors.pagina_web}>
            <FieldLabel htmlFor="eu-web">Sitio web</FieldLabel>
            <Input
              id="eu-web"
              placeholder="https://"
              {...register('pagina_web')}
            />
            <FieldError errors={[errors.pagina_web]} />
          </Field>
          <FieldSeparator />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.institutionTypeId}>
              <FieldLabel>
                Tipo de institución <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="institutionTypeId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
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
                Campus titular <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="campusId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
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
          <Field data-invalid={!!errors.utilizationId}>
            <FieldLabel>
              Utilización <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              control={control}
              name="utilizationId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
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
          <Field orientation="horizontal">
            <Controller
              control={control}
              name="isCatholic"
              render={({ field }) => (
                <Checkbox
                  id="eu-catholic"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FieldContent>
              <FieldLabel htmlFor="eu-catholic">
                Universidad católica
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
            <Field data-invalid={!!errors.regionId}>
              <FieldLabel>
                Región <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="regionId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
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
            <Field data-invalid={!!errors.countryId}>
              <FieldLabel>
                País <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="countryId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
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
            <Field data-invalid={!!errors.city}>
              <FieldLabel htmlFor="eu-city">Ciudad</FieldLabel>
              <Input id="eu-city" placeholder="Madrid" {...register('city')} />
              <FieldError errors={[errors.city]} />
            </Field>
            <Field data-invalid={!!errors.address}>
              <FieldLabel htmlFor="eu-address">Dirección</FieldLabel>
              <Input id="eu-address" {...register('address')} />
              <FieldError errors={[errors.address]} />
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>

      {/* ── Vigencia ── */}
      <FieldSet>
        <FieldLegend>Vigencia</FieldLegend>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.start}>
              <FieldLabel htmlFor="eu-start">
                Inicio <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="eu-start"
                type="date"
                aria-invalid={!!errors.start}
                {...register('start')}
              />
              <FieldError errors={[errors.start]} />
            </Field>
            <Field data-invalid={!!errors.expires}>
              <FieldLabel htmlFor="eu-expires">Vigencia hasta</FieldLabel>
              <Input
                id="eu-expires"
                type="date"
                aria-invalid={!!errors.expires}
                {...register('expires')}
              />
              <FieldDescription>Vacío si es indefinida.</FieldDescription>
              <FieldError errors={[errors.expires]} />
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
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
