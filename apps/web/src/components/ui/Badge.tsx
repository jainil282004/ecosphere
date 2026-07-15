import clsx from 'clsx';
import { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'primary', className }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset';
  
  const variants = {
    primary: 'bg-brand-500/10 text-brand-400 ring-brand-500/20',
    secondary: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    danger: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    outline: 'bg-transparent text-slate-300 ring-white/10',
  };

  return (
    <span className={clsx(baseStyles, variants[variant], className)}>
      {children}
    </span>
  );
}
