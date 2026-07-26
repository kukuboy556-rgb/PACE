import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#f97316', '#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];

export function SimpleBarChart({ data, xKey = 'name', yKey = 'value', height = 200 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
        <Bar dataKey={yKey} fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, dataKey = 'value', nameKey = 'name', height = 200 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ProgressBar({ value, max = 100, label, color = 'bg-brand-500' }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div>
      {label && <div className="flex justify-between text-xs mb-1"><span className="text-slate-600 dark:text-slate-400">{label}</span><span className="font-semibold text-slate-700 dark:text-slate-300">{pct}%</span></div>}
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
