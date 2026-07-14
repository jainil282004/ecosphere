import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Radar, ShieldCheck, Sparkles } from 'lucide-react';
import { EcoSphereLogo, EcoSphereWordmark } from '@/components/EcoSphereLogo';

const HIGHLIGHTS = [
  {
    icon: Radar,
    title: 'Live carbon intelligence',
    body: 'Scope 1–3 emissions calculated automatically from your operational data.',
  },
  {
    icon: Sparkles,
    title: 'Engagement, gamified',
    body: 'Challenges, XP, badges and rewards turn every employee into a sustainability lead.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit-ready governance',
    body: 'BRSR · GRI · CSRD frameworks with signed evidence trails and role-based controls.',
  },
];

const STATS = [
  { label: 'Emissions tracked', value: '128M kg' },
  { label: 'CSR volunteers', value: '42K' },
  { label: 'Frameworks', value: 'BRSR · GRI' },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)]">
      {/* ── Hero panel ────────────────────────────────────────────── */}
      <div className="relative hidden overflow-hidden bg-ink-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Ambient gradient orbs */}
        <div className="pointer-events-none absolute inset-0 bg-grid-fade" />
        <div className="pointer-events-none absolute -left-32 top-16 h-[28rem] w-[28rem] rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />

        {/* Header wordmark */}
        <div className="relative z-10">
          <EcoSphereWordmark size="lg" tagline="Enterprise ESG Platform" animated />
        </div>

        {/* Big animated globe + headline */}
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-xl space-y-6">
            <p className="eyebrow">Sustainability, operationalised</p>
            <h2 className="font-display text-4xl font-bold leading-[1.1] text-white sm:text-5xl">
              Turn ESG into a <span className="text-gradient-brand">competitive</span> advantage.
            </h2>
            <p className="text-base leading-relaxed text-slate-400">
              EcoSphere unifies carbon accounting, employee engagement, and governance compliance
              into one auditable operating system — so your entire organisation moves in the same
              direction on climate, people, and integrity.
            </p>
            <ul className="space-y-4 pt-2">
              {HIGHLIGHTS.map(({ icon: Icon, title: t, body }) => (
                <li key={t} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 ring-1 ring-brand-400/25">
                    <Icon className="h-4 w-4 text-brand-300" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t}</p>
                    <p className="mt-0.5 text-sm text-slate-400">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Floating globe */}
          <div
            className="relative hidden xl:flex xl:items-center xl:justify-center"
            style={{ animation: 'float-slow 6s ease-in-out infinite' }}
          >
            <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-3xl" />
            <EcoSphereLogo size="2xl" animated />
          </div>
        </div>

        {/* Footer strip: stats + compliance */}
        <div className="relative z-10 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 backdrop-blur"
              >
                <p className="font-display text-lg font-bold text-white">{stat.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-brand-400" />
            SOC 2 ready · GDPR aligned · Multi-tenant by design · End-to-end encrypted
          </div>
        </div>
      </div>

      {/* ── Form panel ────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_55%)]" />
        <div className="relative w-full max-w-md">
          {/* Mobile wordmark */}
          <div className="mb-6 flex lg:hidden">
            <Link to="/login">
              <EcoSphereWordmark size="md" animated />
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-[2.5rem]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{subtitle}</p>
          </div>

          <div className="card">{children}</div>

          {footer ? <div className="mt-6">{footer}</div> : null}

          <p className="mt-8 text-center text-[11px] uppercase tracking-[0.24em] text-slate-600">
            © {new Date().getFullYear()} EcoSphere · Made for teams that measure what matters
          </p>
        </div>
      </div>
    </div>
  );
}
