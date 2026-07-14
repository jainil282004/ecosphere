import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { loginSchema, type LoginInput } from '@ecosphere/shared';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api-client';
import { Button, Input } from '@/components/ui';
import { AuthShell } from './AuthShell';

const DEMO_USERS = [
  { role: 'Employee', email: 'employee@greentech.io' },
  { role: 'ESG Manager', email: 'esgmanager@greentech.io' },
  { role: 'Dept. Head', email: 'depthead@greentech.io' },
  { role: 'Org Admin', email: 'orgadmin@greentech.io' },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'employee@greentech.io', password: 'Password123!' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values.email.trim(), values.password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
    }
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue driving carbon, people, and governance outcomes across your organisation."
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="label" htmlFor="email">
            Work email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...form.register('email')}
          />
          {form.formState.errors.email ? (
            <p className="field-error">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label mb-0" htmlFor="password">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-brand-300 hover:text-brand-200"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1.5">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-slate-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.password ? (
            <p className="field-error">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-danger-400/25 bg-danger-500/10 px-4 py-3 text-sm text-danger-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={form.formState.isSubmitting}
          rightIcon={!form.formState.isSubmitting ? <ArrowRight className="h-4 w-4" /> : undefined}
          leftIcon={!form.formState.isSubmitting ? <LogIn className="h-4 w-4" /> : undefined}
        >
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in to dashboard'}
        </Button>

        <p className="text-center text-sm text-slate-400">
          Need an account?{' '}
          <Link to="/signup" className="font-semibold text-brand-300 hover:text-brand-200">
            Create one now
          </Link>
        </p>
      </form>

      <div className="mt-8 border-t border-white/[0.06] pt-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
          Demo access
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Password for all demo users: <span className="text-slate-200">Password123!</span>
        </p>
        <div className="mt-3 grid gap-1.5">
          {DEMO_USERS.map((demo) => (
            <button
              key={demo.email}
              type="button"
              onClick={() => {
                form.setValue('email', demo.email);
                form.setValue('password', 'Password123!');
              }}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-left text-xs text-slate-300 transition hover:border-brand-400/30 hover:bg-white/[0.05] hover:text-white"
            >
              <span className="font-semibold">{demo.role}</span>
              <span className="text-slate-500">{demo.email}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
