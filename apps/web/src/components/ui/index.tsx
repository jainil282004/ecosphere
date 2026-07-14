import clsx from 'clsx';
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { EcoSphereLogo } from '../EcoSphereLogo';

// ── Buttons ───────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  outline: 'btn-outline',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

interface CommonButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & CommonButtonProps;

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(VARIANT_CLASS[variant], SIZE_CLASS[size], className)}
      {...props}
    >
      {loading ? <Spinner size="xs" /> : leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & CommonButtonProps;

export function ButtonLink({
  className,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a className={clsx(VARIANT_CLASS[variant], SIZE_CLASS[size], className)} {...props}>
      {loading ? <Spinner size="xs" /> : leftIcon}
      <span>{children}</span>
      {rightIcon}
    </a>
  );
}

// ── Inputs ────────────────────────────────────────────────────────────────────

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={clsx('input', className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={clsx('input min-h-[120px] resize-y', className)}
        {...props}
      />
    );
  },
);

// ── Cards ─────────────────────────────────────────────────────────────────────

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'brand' | 'accent';
  interactive?: boolean;
}

export function Card({ children, className, tone = 'default', interactive, ...rest }: CardProps) {
  const toneClass =
    tone === 'brand'
      ? 'ring-1 ring-brand-400/20'
      : tone === 'accent'
        ? 'ring-1 ring-accent-400/20'
        : '';
  return (
    <div
      className={clsx(
        'card',
        toneClass,
        interactive && 'cursor-pointer transition hover:border-brand-400/30 hover:shadow-glow',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumbs?: Array<{ label: string; to?: string }>;
  meta?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  breadcrumbs,
  meta,
}: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 space-y-3">
        {breadcrumbs?.length ? (
          <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {crumb.to ? (
                  <a href={crumb.to} className="hover:text-slate-300">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-slate-400">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 ? <span className="text-slate-700">/</span> : null}
              </span>
            ))}
          </nav>
        ) : null}
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="h-display">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
        ) : null}
        {meta ? <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div> : null}
      </div>
      {action ? <div className="flex flex-shrink-0 flex-wrap gap-2">{action}</div> : null}
    </header>
  );
}

// ── Radial gauge ──────────────────────────────────────────────────────────────

interface RadialGaugeProps {
  value: number;
  max?: number;
  label?: string;
  sublabel?: string;
  size?: number;
  tone?: 'brand' | 'accent' | 'gold' | 'danger';
}

const GAUGE_STROKE: Record<NonNullable<RadialGaugeProps['tone']>, string> = {
  brand: '#10b981',
  accent: '#8b5cf6',
  gold: '#f59e0b',
  danger: '#f43f5e',
};

export function RadialGauge({
  value,
  max = 100,
  label,
  sublabel,
  size = 168,
  tone = 'brand',
}: RadialGaugeProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const pct = clamped / max;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct * 0.75); /* 3/4 arc */
  const rotation = -225; // start at bottom-left

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`gauge-${tone}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={GAUGE_STROKE[tone]} stopOpacity="0.4" />
            <stop offset="100%" stopColor={GAUGE_STROKE[tone]} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(148,163,184,0.14)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c * 0.75} ${c}`}
          transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#gauge-${tone}-${size})`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <p className="font-display text-4xl font-bold leading-none text-white num">
          {clamped.toFixed(1)}
        </p>
        {label ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {label}
          </p>
        ) : null}
        {sublabel ? <p className="text-xs text-slate-400">{sublabel}</p> : null}
      </div>
    </div>
  );
}

// ── Hero banner ───────────────────────────────────────────────────────────────

interface HeroBannerProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  score?: {
    value: number;
    label?: string;
    sublabel?: string;
    tone?: RadialGaugeProps['tone'];
  };
  pills?: Array<{ label: string; value: string; tone?: 'brand' | 'accent' | 'gold' | 'danger' }>;
  actions?: ReactNode;
}

const PILL_TONE: Record<'brand' | 'accent' | 'gold' | 'danger', string> = {
  brand: 'bg-brand-500/10 text-brand-200 ring-brand-400/25',
  accent: 'bg-accent-500/10 text-accent-200 ring-accent-400/25',
  gold: 'bg-gold-500/10 text-gold-300 ring-gold-400/25',
  danger: 'bg-danger-500/10 text-danger-300 ring-danger-400/25',
};

export function HeroBanner({ eyebrow, title, subtitle, score, pills, actions }: HeroBannerProps) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-4xl border border-white/[0.06] p-6 shadow-panel backdrop-blur-xl sm:p-8">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(139,92,246,0.14) 55%, rgba(251,191,36,0.08) 100%)',
        }}
      />
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="space-y-4">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-xl text-sm leading-relaxed text-slate-300/90">{subtitle}</p>
          ) : null}
          {pills?.length ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {pills.map((pill) => (
                <span
                  key={pill.label}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 backdrop-blur',
                    PILL_TONE[pill.tone ?? 'brand'],
                  )}
                >
                  <span className="uppercase tracking-wider text-slate-400">{pill.label}</span>
                  <span className="num text-white">{pill.value}</span>
                </span>
              ))}
            </div>
          ) : null}
          {actions ? <div className="flex flex-wrap gap-2 pt-2">{actions}</div> : null}
        </div>

        {score ? (
          <div className="flex items-center justify-center lg:justify-end">
            <RadialGauge
              value={score.value}
              label={score.label ?? 'Composite score'}
              sublabel={score.sublabel}
              tone={score.tone ?? 'brand'}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Status badges ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  draft: 'chip-neutral',
  queued: 'chip-neutral',
  submitted: 'chip-accent',
  pending: 'chip-accent',
  in_progress: 'chip-accent',
  approved: 'chip-brand',
  completed: 'chip-brand',
  resolved: 'chip-brand',
  active: 'chip-brand',
  rejected: 'chip-danger',
  failed: 'chip-danger',
  escalated: 'chip-danger',
  open: 'chip-gold',
  overdue: 'chip-danger',
  extracting: 'chip-accent',
  transforming: 'chip-accent',
  validating: 'chip-accent',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'chip-neutral';
  return <span className={cls}>{status.replace(/_/g, ' ')}</span>;
}

// ── Metric cards ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: 'brand' | 'accent' | 'gold' | 'danger' | 'info';
  delta?: { value: number; label?: string };
  onClick?: () => void;
  href?: string;
}

const TONE: Record<NonNullable<MetricCardProps['tone']>, { bar: string; ring: string; text: string }> = {
  brand: { bar: 'bg-brand-gradient', ring: 'ring-brand-400/20', text: 'text-brand-300' },
  accent: { bar: 'bg-accent-gradient', ring: 'ring-accent-400/20', text: 'text-accent-300' },
  gold: {
    bar: 'bg-gradient-to-r from-gold-500 to-gold-300',
    ring: 'ring-gold-400/25',
    text: 'text-gold-300',
  },
  danger: {
    bar: 'bg-gradient-to-r from-danger-500 to-danger-300',
    ring: 'ring-danger-400/25',
    text: 'text-danger-300',
  },
  info: {
    bar: 'bg-gradient-to-r from-info-500 to-info-300',
    ring: 'ring-info-400/25',
    text: 'text-info-300',
  },
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  delta,
  onClick,
  href,
}: MetricCardProps) {
  const t = TONE[tone];
  const interactive = Boolean(onClick || href);

  const inner = (
    <>
      <div className={clsx('absolute inset-x-0 top-0 h-[3px] rounded-t-3xl', t.bar)} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {icon ? (
          <div className={clsx('shrink-0 rounded-xl bg-white/5 p-2 ring-1', t.ring)}>{icon}</div>
        ) : null}
      </div>
      <p className={clsx('mt-4 font-display text-3xl font-bold leading-none tracking-tight text-white')}>
        <span className="num">{value}</span>
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : <span />}
        {delta ? (
          <span
            className={clsx(
              'text-xs font-semibold',
              delta.value >= 0 ? 'text-brand-300' : 'text-danger-300',
            )}
          >
            {delta.value >= 0 ? '▲' : '▼'} {Math.abs(delta.value).toFixed(1)}%
            {delta.label ? ` ${delta.label}` : ''}
          </span>
        ) : null}
      </div>
    </>
  );

  const wrapperClass = clsx(
    'card relative overflow-hidden animate-slide-up',
    interactive && 'cursor-pointer transition hover:border-brand-400/30 hover:shadow-glow',
  );

  if (href) {
    return (
      <a href={href} className={wrapperClass}>
        {inner}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={clsx(wrapperClass, 'w-full text-left')}>
        {inner}
      </button>
    );
  }
  return <div className={wrapperClass}>{inner}</div>;
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card text-center">
      {icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-300 ring-1 ring-brand-400/20">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton h-4 w-full', className)} />;
}

// ── Spinner ───────────────────────────────────────────────────────────────────

export function Spinner({ size = 'md' }: { size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizes: Record<string, string> = {
    xs: 'h-3.5 w-3.5 border-[1.5px]',
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-[3px]',
  };
  return (
    <span
      aria-hidden
      className={clsx(
        'inline-block animate-spin rounded-full border-brand-400 border-t-transparent',
        sizes[size],
      )}
    />
  );
}

export function LoadingScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15),transparent_55%)]" />
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 -m-6 animate-pulse-slow rounded-full bg-brand-500/25 blur-3xl" />
          <EcoSphereLogo size="xl" animated />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <p className="font-display text-lg font-bold text-white">
            Eco<span className="text-gradient-brand">Sphere</span>
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Initialising sustainability workspace
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

interface SectionProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Section({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  ...rest
}: SectionProps) {
  return (
    <section className={clsx('space-y-4', className)} {...rest}>
      {(eyebrow || title || description || action) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className="h-section mt-2">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
          </div>
          {action ? <div className="flex gap-2">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export * from './NotificationDropdown';
export * from './AIAssistant';
