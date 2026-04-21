'use client';

import { useTransition, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, Loader2, X, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { agreementSchema } from '../schemas';
import { actionCreateAgreement, actionUpdateAgreement } from '../actions';
import type { AllRefs } from '@/features/refs/db';

// ── Raw form values ───────────────────────────────────────────────────────────

interface RawAgreementValues {
  typeId: string;
  statusId: string;
  spots: string;
  link_convenio: string;
  attrIds: number[];
  beneficiaryIds: number[];
}

// ── Props ─────────────────────────────────────────────────────────────────────

type AgreementFormProps = {
  refs: AllRefs;
  backHref: string;
  defaultValues?: Partial<RawAgreementValues>;
} & (
  | { mode: 'create'; universityId: string; universitySlug: string }
  | {
      mode: 'edit';
      universityId: string;
      universitySlug: string;
      agreementId: string;
    }
);

// ── Scrollable Multi-Select Component ─────────────────────────────────────────

function ScrollableMultiSelect({
  label,
  options,
  selected,
  onChange,
  showSearch = true,
  placeholder = 'Buscar...',
}: {
  label: string;
  options: { id: number; name: string }[];
  selected: number[];
  onChange: (ids: number[]) => void;
  showSearch?: boolean;
  placeholder?: string;
}) {
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: number) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{label}</p>

      {/* Selected Items Pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((id) => {
            const opt = options.find((o) => o.id === id);
            return (
              <span
                key={id}
                className="bg-secondary text-secondary-foreground flex items-center gap-1 rounded-md py-1 pr-1 pl-2 text-xs font-medium"
              >
                {opt?.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle(id);
                  }}
                  className="hover:bg-destructive hover:text-destructive-foreground text-muted-foreground rounded-sm p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="bg-background flex flex-col overflow-hidden rounded-md border">
        {/* Search Input (Optional) */}
        {showSearch && (
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Scrollable Checkbox List - Forced constraints */}
        <div
          className="block w-full overflow-x-hidden overflow-y-auto p-2"
          style={{ maxHeight: '250px' }}
        >
          <div className="flex flex-col space-y-1">
            {filteredOptions.length === 0 ? (
              <p className="text-muted-foreground p-2 text-center text-sm">
                No se encontraron resultados.
              </p>
            ) : (
              filteredOptions.map((opt) => (
                <label
                  key={opt.id}
                  className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm transition-colors"
                >
                  <Checkbox
                    className="mt-0.5 shrink-0"
                    checked={selected.includes(opt.id)}
                    onCheckedChange={() => toggle(opt.id)}
                  />
                  <span className="leading-tight">{opt.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AgreementForm(props: AgreementFormProps) {
  const { refs, backHref, defaultValues } = props;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RawAgreementValues>({
    defaultValues: {
      typeId: defaultValues?.typeId ?? '',
      statusId: defaultValues?.statusId ?? '',
      spots: defaultValues?.spots ?? '',
      link_convenio: defaultValues?.link_convenio ?? '',
      attrIds: defaultValues?.attrIds ?? [],
      beneficiaryIds: defaultValues?.beneficiaryIds ?? [],
    },
  });

  function submit(raw: RawAgreementValues) {
    const coerced = {
      typeId: raw.typeId ? parseInt(raw.typeId) : undefined,
      statusId: raw.statusId ? parseInt(raw.statusId) : undefined,
      spots: raw.spots !== '' ? parseInt(raw.spots) : null,
      link_convenio: raw.link_convenio,
      attrIds: raw.attrIds,
      beneficiaryIds: raw.beneficiaryIds,
    };

    const parsed = agreementSchema.safeParse(coerced);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = (issue.path[0] as string | undefined) ?? 'root';
        setError(field as keyof RawAgreementValues, {
          type: 'zod',
          message: issue.message,
        });
      }
      return;
    }

    startTransition(async () => {
      const result =
        props.mode === 'create'
          ? await actionCreateAgreement(
              props.universityId,
              props.universitySlug,
              parsed.data
            )
          : await actionUpdateAgreement(
              props.agreementId,
              props.universityId,
              props.universitySlug,
              parsed.data
            );

      if (result && !result.success) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          if (!message) continue;
          setError(field as keyof RawAgreementValues, {
            type: 'server',
            message,
          });
        }
        if (result.formError) setError('root', { message: result.formError });
      }
    });
  }

  const submitLabel =
    props.mode === 'create' ? 'Crear convenio' : 'Guardar cambios';

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-8">
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      {/* ── Clasificación ── */}
      <FieldSet>
        <FieldLegend>Clasificación</FieldLegend>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.typeId}>
              <FieldLabel>
                Tipo de convenio <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="typeId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-invalid={!!errors.typeId}>
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      {refs.agreementTypes
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
              <FieldError errors={[errors.typeId]} />
            </Field>

            <Field data-invalid={!!errors.statusId}>
              <FieldLabel>
                Estado <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="statusId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-invalid={!!errors.statusId}>
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      {refs.statuses
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
              <FieldError errors={[errors.statusId]} />
            </Field>
          </div>

          <FieldSeparator />

          {/* Changed max-w-[180px] to max-w-45 per Tailwind suggestion */}
          <Field data-invalid={!!errors.spots} className="max-w-45">
            <FieldLabel htmlFor="ag-spots">Plazas</FieldLabel>
            <Input
              id="ag-spots"
              type="number"
              min={0}
              placeholder="Ej. 5"
              aria-invalid={!!errors.spots}
              {...register('spots')}
            />
            <FieldDescription>Dejar vacío si no aplica.</FieldDescription>
            <FieldError errors={[errors.spots]} />
          </Field>

          <FieldSeparator />

          <Field data-invalid={!!errors.link_convenio}>
            <FieldLabel htmlFor="ag-link">Enlace al convenio</FieldLabel>
            <Input
              id="ag-link"
              placeholder="https://…"
              aria-invalid={!!errors.link_convenio}
              {...register('link_convenio')}
            />
            <FieldDescription>
              URL al documento firmado (opcional).
            </FieldDescription>
            <FieldError errors={[errors.link_convenio]} />
          </Field>
        </FieldGroup>
      </FieldSet>

      {/* ── Alcance ── */}
      <FieldSet>
        <FieldLegend>Alcance</FieldLegend>
        <FieldDescription>
          Acreditaciones y escuelas beneficiarias que aplican a este convenio.
        </FieldDescription>
        <FieldGroup>
          <Controller
            control={control}
            name="attrIds"
            render={({ field }) => (
              <ScrollableMultiSelect
                label="Acreditaciones"
                showSearch={false}
                options={refs.attrs
                  .filter((r) => r.id !== 0)
                  .map((r) => ({ id: r.id, name: r.name }))}
                selected={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <FieldSeparator />

          <Controller
            control={control}
            name="beneficiaryIds"
            render={({ field }) => (
              <ScrollableMultiSelect
                label="Escuelas beneficiarias"
                showSearch={true}
                placeholder="Buscar escuela o facultad..."
                options={refs.beneficiaries
                  .filter((r) => r.id !== 0)
                  .map((r) => ({
                    id: r.id,
                    name: `${r.cve} — ${r.name}`,
                  }))}
                selected={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FieldGroup>
      </FieldSet>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between border-t pt-6">
        <Button variant="ghost" asChild>
          <Link href={backHref}>
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
          {isPending ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
