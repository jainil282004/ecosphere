import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@ecosphere/shared';
import { ApiError, apiClient } from '@/lib/api-client';
import { AuthShell } from '@/features/auth/AuthShell';
import { Button, Input } from '@/components/ui';

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; resetToken?: string } | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await apiClient<{ message: string; resetToken?: string }>(
        '/auth/forgot-password',
        { method: 'POST', body: values },
      );
      setSuccess(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Request failed.');
    }
  });

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we will send reset instructions."
      footer={
        <p className="mt-6 text-center text-sm text-slate-400">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-brand-300 hover:text-brand-200">
            Back to sign in
          </Link>
        </p>
      }
    >
      {success ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-brand-400/25 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
            {success.message}
          </p>
          {success.resetToken ? (
            <div className="rounded-xl border border-accent-400/25 bg-accent-500/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Demo reset token</p>
              <p className="mt-2 break-all font-mono text-xs text-accent-200">{success.resetToken}</p>
              <Link
                to={`/reset-password?token=${success.resetToken}`}
                className="mt-3 inline-block text-sm font-semibold text-brand-300 hover:text-brand-200"
              >
                Continue to reset password →
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <Input id="email" type="email" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="field-error">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-xl border border-danger-400/25 bg-danger-500/10 px-4 py-3 text-sm text-danger-200">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" loading={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
