import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { resetPasswordSchema, type ResetPasswordInput } from '@ecosphere/shared';
import { ApiError, apiClient } from '@/lib/api-client';
import { AuthShell } from '@/features/auth/AuthShell';
import { Button, Input } from '@/components/ui';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: searchParams.get('token') ?? '',
      password: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await apiClient('/auth/reset-password', { method: 'POST', body: values });
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset failed.');
    }
  });

  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new password for your account."
      footer={
        <p className="mt-6 text-center text-sm text-slate-400">
          <Link to="/login" className="font-medium text-brand-300 hover:text-brand-200">
            Back to sign in
          </Link>
        </p>
      }
    >
      {done ? (
        <p className="rounded-xl border border-brand-400/25 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
          Password updated. Redirecting to sign in…
        </p>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="label" htmlFor="token">
              Reset token
            </label>
            <Input id="token" {...form.register('token')} />
            {form.formState.errors.token ? (
              <p className="field-error">{form.formState.errors.token.message}</p>
            ) : null}
          </div>

          <div>
            <label className="label" htmlFor="password">
              New password
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
            {form.formState.isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
