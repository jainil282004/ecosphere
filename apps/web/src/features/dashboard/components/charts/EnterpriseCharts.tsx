import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ChartContainer } from '../ChartContainer';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e', '#0ea5e9'];
const TOOLTIP_STYLE = { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' };

export function MonthlyCarbonChart({ data, loading }: { data: any[]; loading?: boolean }) {
  return (
    <ChartContainer title="Monthly Carbon Emissions" subtitle="Scope 1, 2, and 3 (kg CO2e)" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line type="monotone" dataKey="totalCo2e" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6, strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function EnergyConsumptionChart({ data, loading }: { data: any[]; loading?: boolean }) {
  return (
    <ChartContainer title="Energy Consumption" subtitle="Electricity & Fuel (kWh)" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Area type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorEnergy)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function WaterUsageChart({ data, loading }: { data: any[]; loading?: boolean }) {
  return (
    <ChartContainer title="Water Usage" subtitle="Total withdrawn (Liters)" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{fill: '#334155', opacity: 0.4}} />
          <Bar dataKey="water" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function WasteRecyclingChart({ data, loading }: { data: any[]; loading?: boolean }) {
  return (
    <ChartContainer title="Waste & Recycling" subtitle="Diversion Rate" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data?.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function EsgScoreTrendChart({ data, loading }: { data: any[]; loading?: boolean }) {
  return (
    <ChartContainer title="ESG Score Trend" subtitle="Composite Performance (0-100)" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 4, fill: '#8b5cf6' }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function DepartmentComparisonChart({ data, loading }: { data: any[]; loading?: boolean }) {
  return (
    <ChartContainer title="Department Breakdown" subtitle="Carbon Emissions by Dept" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <YAxis dataKey="name" type="category" stroke="#f8fafc" tick={{fontSize: 12, fontWeight: 600}} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{fill: '#334155', opacity: 0.4}} />
          <Bar dataKey="emissions" fill="#f43f5e" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function CarbonSourcePie({ data, loading }: { data: any[]; loading?: boolean }) {
  return (
    <ChartContainer title="Carbon Sources" subtitle="Scope 1, 2, 3 Breakdown" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={90}
            dataKey="value"
            stroke="none"
          >
            {data?.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function ComplianceStackedBar({ data, loading }: { data: any[]; loading?: boolean }) {
  return (
    <ChartContainer title="Compliance Status" subtitle="Open vs Resolved Issues" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{fill: '#334155', opacity: 0.4}} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
          <Bar dataKey="resolved" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
          <Bar dataKey="open" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
