import React from "react";
import {
  LineChart as RechartsLine,
  Line,
  BarChart as RechartsBar,
  Bar,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  CartesianGrid,
} from "recharts";

const tooltipStyle = {
  contentStyle: {
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "8px",
    fontSize: "12px",
    fontFamily: "ui-monospace, monospace",
    color: "#f4f4f5",
  },
  labelStyle: { color: "#a1a1aa" },
};

// ---------- Line Chart ----------
interface LineChartProps {
  data: { label: string; value: number }[];
  color?: string;
  formatValue?: (v: number) => string;
  height?: number;
}

export function LineChart({ data, color = "#10b981", formatValue, height = 240 }: LineChartProps) {
  if (data.length === 0) return <div className="flex items-center justify-center h-[240px] text-xs text-zinc-500">Belum ada data</div>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLine data={data} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
        <defs>
          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#27272a" }} tickLine={false} />
        <YAxis tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={formatValue} />
        <Tooltip {...tooltipStyle} formatter={formatValue ? (val: number) => [formatValue(val), "Revenue"] : undefined} />
        <Area type="monotone" dataKey="value" fill="url(#lineAreaGrad)" stroke="none" />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color, stroke: "#0c0c0e", strokeWidth: 2 }} activeDot={{ r: 5 }} />
      </RechartsLine>
    </ResponsiveContainer>
  );
}

// ---------- Bar Chart ----------
interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  formatValue?: (v: number) => string;
  height?: number;
  horizontal?: boolean;
  maxBars?: number;
}

export function BarChart({ data, color = "#10b981", formatValue, height = 240, horizontal = false, maxBars = 8 }: BarChartProps) {
  const sliced = data.slice(0, maxBars);
  if (sliced.length === 0) return <div className="flex items-center justify-center h-[240px] text-xs text-zinc-500">Belum ada data</div>;

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBar data={sliced} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
          <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={formatValue} />
          <YAxis type="category" dataKey="label" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} width={90} tickFormatter={v => v.length > 14 ? v.slice(0, 14) + "..." : v} />
          <Tooltip {...tooltipStyle} formatter={formatValue ? (val: number) => [formatValue(val), "Jumlah"] : undefined} />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={16} />
        </RechartsBar>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBar data={sliced} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#27272a" }} tickLine={false} angle={-15} textAnchor="end" height={50} />
        <YAxis tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={formatValue} />
        <Tooltip {...tooltipStyle} formatter={formatValue ? (val: number) => [formatValue(val), "Nilai"] : undefined} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </RechartsBar>
    </ResponsiveContainer>
  );
}

// ---------- Donut Chart ----------
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  height?: number;
}

export function DonutChart({ data, height = 240 }: DonutChartProps) {
  if (data.length === 0) return <div className="flex items-center justify-center h-[240px] text-xs text-zinc-500">Belum ada data</div>;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={(val: number) => [`${val} (${Math.round((val / total) * 100)}%)`, "Jumlah"]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-1 justify-center">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: d.color }} />
            <span className="text-zinc-400">{d.label}</span>
            <span className="text-white font-bold font-sans">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Stacked Bar Chart ----------
interface StackedBarProps {
  data: { label: string; [key: string]: string | number }[];
  keys: string[];
  colors: string[];
  height?: number;
}

export function StackedBar({ data, keys, colors, height = 200 }: StackedBarProps) {
  if (data.length === 0) return <div className="flex items-center justify-center h-[200px] text-xs text-zinc-500">Belum ada data</div>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBar data={data} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#27272a" }} tickLine={false} />
        <YAxis tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        {keys.map((key, i) => (
          <Bar key={key} dataKey={key} stackId="a" fill={colors[i]} radius={i === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} maxBarSize={32} />
        ))}
      </RechartsBar>
    </ResponsiveContainer>
  );
}

// ---------- Combo Chart ----------
interface ComboChartProps {
  data: { label: string; count: number; revenue: number }[];
  height?: number;
}

export function ComboChart({ data, height = 240 }: ComboChartProps) {
  if (data.length === 0) return <div className="flex items-center justify-center h-[240px] text-xs text-zinc-500">Belum ada data</div>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
        <defs>
          <linearGradient id="comboLineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#27272a" }} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#27272a" }} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#27272a" }} tickLine={false} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : `${(v / 1000).toFixed(0)}rb`} />
        <Tooltip {...tooltipStyle} />
        <Bar yAxisId="left" dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} name="Booking" />
        <Area yAxisId="right" type="monotone" dataKey="revenue" fill="url(#comboLineGrad)" stroke="none" />
        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981", stroke: "#0c0c0e", strokeWidth: 2 }} name="Revenue" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
