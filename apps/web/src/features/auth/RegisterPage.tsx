import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { registerAccountSchema, type RegisterAccountInput } from '@ecosphere/shared';
import { ApiError } from '@/lib/api-client';
import { AuthShell } from '@/features/auth/AuthShell';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuth();

  const form = useForm<RegisterAccountInput>({
    resolver: zodResolver(registerAccountSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      organizationSlug: 'greentech-industries',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await register(values);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed.');
    }
  });

  return (
    <AuthShell
      title="Create account"
      subtitle="Join your organization as an employee contributor."
      footer={
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-300 hover:text-brand-200">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="firstName">
              First name
            </label>
            <Input id="firstName" {...form.register('firstName')} />
            {form.formState.errors.firstName ? (
              <p className="field-error">{form.formState.errors.firstName.message}</p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="lastName">
              Last name
            </label>
            <Input id="lastName" {...form.register('lastName')} />
            {form.formState.errors.lastName ? (
              <p className="field-error">{form.formState.errors.lastName.message}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="email">
            Work email
          </label>
          <Input id="email" type="email" {...form.register('email')} />
          {form.formState.errors.email ? (
            <p className="field-error">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <Input id="password" type="password" {...form.register('password')} />
          {form.formState.errors.password ? (
            <p className="field-error">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-xl border border-danger-400/25 bg-danger-500/10 px-4 py-3 text-sm text-danger-200">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" loading={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
