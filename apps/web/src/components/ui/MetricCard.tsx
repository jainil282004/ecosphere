import clsx from 'clsx';
import { ReactNode, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';

export interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: 'brand' | 'accent' | 'gold' | 'danger' | 'info';
  delta?: { value: number; label?: string; time?: string };
  sparklineData?: number[];
  onClick?: () => void;
  href?: string;
  delay?: number;
}

const TONE: Record<NonNullable<MetricCardProps['tone']>, { bar: string; ring: string; text: string; stroke: string }> = {
  brand: { bar: 'bg-brand-gradient', ring: 'ring-brand-400/20', text: 'text-brand-300', stroke: '#10b981' },
  accent: { bar: 'bg-accent-gradient', ring: 'ring-accent-400/20', text: 'text-accent-300', stroke: '#8b5cf6' },
  gold: { bar: 'bg-gradient-to-r from-gold-500 to-gold-300', ring: 'ring-gold-400/25', text: 'text-gold-300', stroke: '#f59e0b' },
  danger: { bar: 'bg-gradient-to-r from-danger-500 to-danger-300', ring: 'ring-danger-400/25', text: 'text-danger-300', stroke: '#f43f5e' },
  info: { bar: 'bg-gradient-to-r from-info-500 to-info-300', ring: 'ring-info-400/25', text: 'text-info-300', stroke: '#0ea5e9' },
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  delta,
  sparklineData,
  onClick,
  href,
  delay = 0,
}: MetricCardProps) {
  const t = TONE[tone];
  const interactive = Boolean(onClick || href);

  const chartData = useMemo(() => {
    if (!sparklineData || sparklineData.length === 0) return null;
    return sparklineData.map((val, idx) => ({ name: idx, value: val }));
  }, [sparklineData]);

  const isPositive = delta ? delta.value >= 0 : true;

  const inner = (
    <div className="relative h-full w-full p-5 flex flex-col justify-between">
      <div className={clsx('absolute inset-x-0 top-0 h-[3px]', t.bar)} />
      
      {/* Background Sparkline */}
      {chartData && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 opacity-30">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Line
                type="monotone"
                dataKey="value"
                stroke={t.stroke}
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <div className="flex items-start justify-between gap-3 relative z-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          {icon ? (
            <div className={clsx('shrink-0 rounded-xl bg-white/5 p-2 ring-1 shadow-sm', t.ring)}>{icon}</div>
          ) : null}
        </div>
        
        <p className={clsx('mt-4 font-display text-4xl font-bold leading-none tracking-tight text-white relative z-10')}>
          <span className="num">{value}</span>
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-1 relative z-10">
        <div className="flex items-center gap-2">
          {delta ? (
            <span
              className={clsx(
                'inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-md',
                isPositive ? 'bg-brand-500/10 text-brand-300' : 'bg-danger-500/10 text-danger-300',
              )}
            >
              {isPositive ? '▲' : '▼'} {Math.abs(delta.value).toFixed(1)}%
            </span>
          ) : null}
          {delta?.label ? (
            <span className="text-xs font-medium text-slate-400">{delta.label}</span>
          ) : hint ? (
            <span className="text-xs text-slate-500">{hint}</span>
          ) : null}
        </div>
        {delta?.time && (
          <p className="text-[10px] text-slate-500 mt-0.5">{delta.time}</p>
        )}
      </div>
    </div>
  );

  const wrapperClass = clsx(
    'card relative overflow-hidden bg-[#0f172a] shadow-lg transition-colors p-0 h-full',
    interactive ? 'cursor-pointer hover:border-brand-400/40 hover:shadow-glow' : 'border-white/[0.08]'
  );

  const motionProps: any = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: 'easeOut' },
    whileHover: interactive ? { scale: 1.02, y: -2 } : {},
    className: wrapperClass,
  };

  if (href) {
    return (
      <motion.a href={href} {...motionProps}>
        {inner}
      </motion.a>
    );
  }
  if (onClick) {
    return (
      <motion.button type="button" onClick={onClick} {...motionProps} className={clsx(wrapperClass, 'w-full text-left')}>
        {inner}
      </motion.button>
    );
  }
  return <motion.div {...motionProps}>{inner}</motion.div>;
}
