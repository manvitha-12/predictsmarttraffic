import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  background: "oklch(0.18 0.05 270 / 95%)",
  border: "1px solid oklch(1 0 0 / 10%)",
  borderRadius: 12,
  color: "white",
  fontSize: 12,
} as const;

export function HourlyTrendChart({ data }: { data: { hour: string; vehicles: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.22 275)" stopOpacity={0.7} />
            <stop offset="100%" stopColor="oklch(0.62 0.22 275)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
        <XAxis dataKey="hour" stroke="oklch(0.7 0.04 270)" fontSize={11} />
        <YAxis stroke="oklch(0.7 0.04 270)" fontSize={11} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="vehicles" stroke="oklch(0.72 0.2 275)" fill="url(#g1)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CongestionBarChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
        <XAxis dataKey="name" stroke="oklch(0.7 0.04 270)" fontSize={11} />
        <YAxis stroke="oklch(0.7 0.04 270)" fontSize={11} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="oklch(0.62 0.22 275)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ["oklch(0.72 0.18 155)", "oklch(0.78 0.16 75)", "oklch(0.65 0.24 18)"];
export function DistributionPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
