import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui';
import { CHART_TOOLTIP_STYLE, SCOPE_THEME } from '../constants';
import type { ScopeTrendPoint } from '../types';

interface ScopeHistoricalChartProps {
  data: ScopeTrendPoint[];
  isLoading: boolean;
}

export function ScopeHistoricalChart({ data, isLoading }: ScopeHistoricalChartProps) {
  return (
    <Card aria-labelledby="scope-historical-title">
      <header>
        <p className="eyebrow">Carbon Intelligence</p>
        <h2 id="scope-historical-title" className="mt-2 h-section">
          Scope 1 / 2 / 3 Historical Trends
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Stacked monthly emissions in kg CO₂e. Shade depth shows the emission scope.
        </p>
      </header>

      <div
        className="mt-6 h-80"
        role="img"
        aria-label="Stacked bar chart comparing Scope 1, 2, and 3 emissions by month"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Loading trend data…
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Log environmental metrics to populate scope trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.10)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: 'rgba(148,163,184,0.20)' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: 'rgba(148,163,184,0.20)' }}
                tickFormatter={(v: number) => `${v} kg`}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                cursor={{ fill: 'rgba(16,185,129,0.06)' }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)} kg`, name]}
              />
              <Legend
                wrapperStyle={{ paddingTop: 12 }}
                formatter={(value) => (
                  <span className="text-sm text-slate-300">{value}</span>
                )}
              />
              <Bar
                dataKey="scope1"
                name={SCOPE_THEME.scope_1.label}
                stackId="scopes"
                fill={SCOPE_THEME.scope_1.hex}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="scope2"
                name={SCOPE_THEME.scope_2.label}
                stackId="scopes"
                fill={SCOPE_THEME.scope_2.hex}
              />
              <Bar
                dataKey="scope3"
                name={SCOPE_THEME.scope_3.label}
                stackId="scopes"
                fill={SCOPE_THEME.scope_3.hex}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400" aria-label="Scope legend">
        {(Object.keys(SCOPE_THEME) as Array<keyof typeof SCOPE_THEME>).map((key) => (
          <li key={key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: SCOPE_THEME[key].hex }}
              aria-hidden
            />
            {SCOPE_THEME[key].label}: {SCOPE_THEME[key].subtitle}
          </li>
        ))}
      </ul>
    </Card>
  );
}
