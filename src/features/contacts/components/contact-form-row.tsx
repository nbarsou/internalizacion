'use client';

import { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { contactSchema } from '../schemas';
import type { ContactFormValues } from '../schemas';

// ── Raw form values ───────────────────────────────────────────────────────────

interface RawContactValues {
  name: string;
  concernType: string;
  valueType: string;
  value: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ContactFormRowProps {
  defaultValues?: Partial<RawContactValues>;
  onSubmit: (values: ContactFormValues) => Promise<{
    success: boolean;
    fieldErrors?: Partial<Record<string, string>>;
    formError?: string;
  }>;
  onCancel: () => void;
  colSpan?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContactFormRow({
  defaultValues,
  onSubmit,
  onCancel,
}: ContactFormRowProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RawContactValues>({
    defaultValues: {
      name: defaultValues?.name ?? '',
      concernType: defaultValues?.concernType ?? '',
      valueType: defaultValues?.valueType ?? '',
      value: defaultValues?.value ?? '',
    },
  });

  function submit(raw: RawContactValues) {
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = (issue.path[0] as string | undefined) ?? 'root';
        setError(field as keyof RawContactValues, {
          type: 'zod',
          message: issue.message,
        });
      }
      return;
    }

    startTransition(async () => {
      const result = await onSubmit(parsed.data);
      if (!result.success) {
        for (const [field, message] of Object.entries(
          result.fieldErrors ?? {}
        )) {
          if (!message) continue;
          setError(field as keyof RawContactValues, {
            type: 'server',
            message,
          });
        }
      }
    });
  }

  return (
    <>
      <TableRow className="bg-muted/30">
        {/* Name */}
        <TableCell>
          <Input
            placeholder="Nombre (opcional)"
            className="h-8 text-sm"
            {...register('name')}
          />
        </TableCell>

        {/* Concern type */}
        <TableCell>
          <Controller
            control={control}
            name="concernType"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger
                  className="h-8 text-sm"
                  aria-invalid={!!errors.concernType}
                >
                  <SelectValue placeholder="Tipo…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOMING">Entrante</SelectItem>
                  <SelectItem value="OUTGOING">Saliente</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.concernType && (
            <p className="text-destructive mt-1 text-xs">
              {errors.concernType.message}
            </p>
          )}
        </TableCell>

        {/* Value type */}
        <TableCell>
          <Controller
            control={control}
            name="valueType"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger
                  className="h-8 text-sm"
                  aria-invalid={!!errors.valueType}
                >
                  <SelectValue placeholder="Canal…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Correo</SelectItem>
                  <SelectItem value="PHONE">Teléfono</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.valueType && (
            <p className="text-destructive mt-1 text-xs">
              {errors.valueType.message}
            </p>
          )}
        </TableCell>

        {/* Value */}
        <TableCell>
          <Input
            placeholder="email@ejemplo.com"
            className="h-8 text-sm"
            aria-invalid={!!errors.value}
            {...register('value')}
          />
          {errors.value && (
            <p className="text-destructive mt-1 text-xs">
              {errors.value.message}
            </p>
          )}
        </TableCell>

        {/* Actions */}
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onCancel}
              disabled={isPending}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              className="h-7 w-7 bg-orange-600 hover:bg-orange-700"
              onClick={handleSubmit(submit)}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
}
