import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHistoryFn } from "@/lib/predictions.functions";
import { StatCard } from "@/components/stat-card";
import { CongestionBarChart, DistributionPie, HourlyTrendChart } from "@/components/traffic-chart";
import { AlertTriangle, Car, Gauge, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SmartTraffic" },
      { name: "description", content: "Live traffic prediction dashboard with charts, trends and alerts." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchHistory = useServerFn(getHistoryFn);
  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => fetchHistory({ data: { limit: 200 } }),
    refetchInterval: 8000,
  });

  const rows = data?.rows ?? [];
  const total = rows.length;
  const high = rows.filter((r) => r.prediction === "High").length;
  const med = rows.filter((r) => r.prediction === "Medium").length;
  const low = rows.filter((r) => r.prediction === "Low").length;
  const avgVehicles = total ? Math.round(rows.reduce((a, r) => a + r.vehicles, 0) / total) : 0;

  // Hourly aggregation
  const byHour = Array.from({ length: 24 }, (_, h) => {
    const r = rows.filter((x) => x.hour === h);
    return { hour: `${h}:00`, vehicles: r.length ? Math.round(r.reduce((a, x) => a + x.vehicles, 0) / r.length) : 0 };
  });

  // Congestion by junction
  const byJunction = Array.from(new Set(rows.map((r) => r.junction))).sort().map((j) => ({
    name: `J${j}`,
    value: rows.filter((r) => r.junction === j && r.prediction === "High").length,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live metrics from the prediction store · auto-refreshes every 8s.</p>
        </div>
        <Button asChild className="btn-glow bg-[image:var(--gradient-primary)]">
          <Link to="/prediction"><Sparkles className="mr-2 h-4 w-4" /> New prediction</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Gauge className="h-4 w-4" />} label="Total predictions" value={total} hint={isLoading ? "loading…" : "all-time"} />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="High congestion" value={high} tone="danger" hint={total ? `${Math.round((high / total) * 100)}% of traffic` : "—"} />
        <StatCard icon={<Car className="h-4 w-4" />} label="Avg vehicles / hr" value={avgVehicles} tone="warning" />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Model" value="RF + XGB" tone="success" hint="Soft voting ensemble" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Avg vehicles by hour</h2>
            <span className="text-xs text-muted-foreground">{total} samples</span>
          </div>
          <HourlyTrendChart data={byHour} />
        </div>
        <div className="glass rounded-3xl p-6">
          <h2 className="mb-3 font-semibold">Density distribution</h2>
          <DistributionPie data={[{ name: "Low", value: low }, { name: "Medium", value: med }, { name: "High", value: high }]} />
        </div>
        <div className="glass rounded-3xl p-6 lg:col-span-3">
          <h2 className="mb-3 font-semibold">High-congestion events by junction</h2>
          <CongestionBarChart data={byJunction} />
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="mb-4 font-semibold">Recent predictions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2">When</th><th>Hour</th><th>Vehicles</th><th>Rain</th><th>Junction</th><th>Prediction</th><th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="py-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.hour}:00</td>
                  <td>{r.vehicles}</td>
                  <td>{r.rain}</td>
                  <td>J{r.junction}</td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      r.prediction === "High" ? "bg-rose-500/20 text-rose-200" :
                      r.prediction === "Medium" ? "bg-amber-500/20 text-amber-200" :
                      "bg-emerald-500/20 text-emerald-200"
                    }`}>{r.prediction}</span>
                  </td>
                  <td>{Math.round(r.confidence * 100)}%</td>
                </tr>
              ))}
              {!rows.length && !isLoading ? (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No predictions yet — try one!</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
