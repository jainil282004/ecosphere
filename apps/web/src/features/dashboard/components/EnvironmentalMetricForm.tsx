import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Leaf, Loader2 } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import {
  createCarbonTransactionFormSchema,
  parseFlexibleDateTime,
  toDatetimeLocalValue,
  type CreateCarbonTransactionFormInput,
} from '@ecosphere/shared';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { ApiError, apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { SCOPE_THEME } from '../constants';
import { useLogEnvironmentalMetric } from '../hooks/useLogEnvironmentalMetric';
import type { DepartmentOption, EmissionFactorOption } from '../types';

function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-brand-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function EnvironmentalMetricForm({ orgId }: { orgId: string }) {
  const mutation = useLogEnvironmentalMetric(orgId);

  const factorsQuery = useQuery({
    queryKey: queryKeys.carbon.factors(orgId),
    queryFn: () =>
      apiClient<EmissionFactorOption[]>(`/orgs/${orgId}/environmental/emission-factors`),
  });

  const departmentsQuery = useQuery({
    queryKey: queryKeys.departments(orgId),
    queryFn: () => apiClient<DepartmentOption[]>(`/orgs/${orgId}/departments`),
  });

  const form = useForm<CreateCarbonTransactionFormInput>({
    resolver: zodResolver(createCarbonTransactionFormSchema),
    defaultValues: {
      activityType: 'Electricity consumption',
      quantity: 100,
      unit: 'kWh',
      emissionFactorId: '',
      departmentId: '',
      activityDate: toDatetimeLocalValue(),
      description: '',
    },
  });

  const factors = factorsQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];
  const selectedFactorId = form.watch('emissionFactorId');
  const selectedFactor = factors.find((f) => f.id === selectedFactorId);

  useEffect(() => {
    if (factors[0] && !form.getValues('emissionFactorId')) {
      form.setValue('emissionFactorId', factors[0].id);
      form.setValue('unit', factors[0].unit);
    }
    if (departments[0] && !form.getValues('departmentId')) {
      form.setValue('departmentId', departments[0].id);
    }
  }, [factors, departments, form]);

  useEffect(() => {
    if (selectedFactor) {
      form.setValue('unit', selectedFactor.unit);
    }
  }, [selectedFactor, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync({
      ...values,
      activityDate: parseFlexibleDateTime(values.activityDate),
    });
    form.reset({
      ...values,
      activityDate: toDatetimeLocalValue(),
      description: '',
    });
  });

  return (
    <Card
      className="h-full"
      aria-labelledby="env-metric-form-title"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-400/10 ring-1 ring-brand-400/20"
          aria-hidden
        >
          <Leaf className="h-5 w-5 text-brand-300" />
        </div>
        <div>
          <p className="eyebrow">Data Capture</p>
          <h2 id="env-metric-form-title" className="mt-2 text-lg font-semibold tracking-tight text-white">
            Log Environmental Metric
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Submit a carbon activity with GHG Protocol calculation and approval workflow.
          </p>
        </div>
      </div>

      {mutation.isSuccess ? (
        <div
          role="status"
          className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-200"
        >
          Metric submitted for approval. Dashboard will refresh automatically.
        </div>
      ) : null}

      {mutation.isError ? (
        <div role="alert" className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : 'Submission failed. Please try again.'}
        </div>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <FormField
          label="Activity type"
          htmlFor="activityType"
          error={form.formState.errors.activityType?.message}
        >
          <Input id="activityType" aria-invalid={Boolean(form.formState.errors.activityType)} {...form.register('activityType')} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Department"
            htmlFor="departmentId"
            error={form.formState.errors.departmentId?.message}
          >
            <select id="departmentId" className="input" {...form.register('departmentId')}>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Emission factor"
            htmlFor="emissionFactorId"
            error={form.formState.errors.emissionFactorId?.message}
          >
            <select id="emissionFactorId" className="input" {...form.register('emissionFactorId')}>
              {factors.map((factor) => (
                <option key={factor.id} value={factor.id}>
                  [{SCOPE_THEME[factor.scope].label}] {factor.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {selectedFactor ? (
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${SCOPE_THEME[selectedFactor.scope].tailwind}`}
            aria-live="polite"
          >
            {SCOPE_THEME[selectedFactor.scope].label} · {SCOPE_THEME[selectedFactor.scope].subtitle}
            <span className="text-slate-400">
              ({selectedFactor.factorValue} kg / {selectedFactor.unit})
            </span>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Quantity"
            htmlFor="quantity"
            error={form.formState.errors.quantity?.message}
          >
            <Input
              id="quantity"
              type="number"
              step="0.01"
              aria-invalid={Boolean(form.formState.errors.quantity)}
              {...form.register('quantity', { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="Unit" htmlFor="unit" error={form.formState.errors.unit?.message}>
            <Input id="unit" readOnly className="opacity-80" {...form.register('unit')} />
          </FormField>
        </div>

        <FormField
          label="Evidence document hash (optional)"
          htmlFor="evidenceDocumentHash"
          hint="64-character SHA-256 hex digest for verification"
          error={form.formState.errors.evidenceDocumentHash?.message}
        >
          <Input
            id="evidenceDocumentHash"
            placeholder="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            {...form.register('evidenceDocumentHash')}
          />
        </FormField>

        <FormField label="Notes" htmlFor="description">
          <Textarea id="description" rows={2} {...form.register('description')} />
        </FormField>

        <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Calculating & submitting…
            </>
          ) : (
            'Submit for approval'
          )}
        </Button>
      </form>
    </Card>
  );
}
