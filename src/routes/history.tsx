import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHistoryFn } from "@/lib/predictions.functions";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — SmartTraffic" },
      { name: "description", content: "Full prediction history with search and filtering." },
    ],
  }),
  component: History,
});

function History() {
  const fetchHistory = useServerFn(getHistoryFn);
  const { data, isLoading } = useQuery({
    queryKey: ["history-page"],
    queryFn: () => fetchHistory({ data: { limit: 500 } }),
  });
  const [q, setQ] = useState("");
  const rows = data?.rows ?? [];

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      [r.prediction, `j${r.junction}`, `${r.hour}:00`, r.vehicles.toString()].join(" ").toLowerCase().includes(t)
    );
  }, [rows, q]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Prediction history</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {rows.length} records</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by prediction, junction, hour…" className="pl-9" />
        </div>
      </header>

      <div className="glass rounded-3xl p-2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">When</th><th>Hour</th><th>Temp</th><th>Rain</th><th>Holiday</th><th>Junction</th><th>Vehicles</th><th>Events</th><th>Prediction</th><th>Conf.</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border/40 hover:bg-white/5">
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.hour}:00</td>
                <td>{r.temperature}°</td>
                <td>{r.rain}</td>
                <td>{r.holiday ? "Yes" : "—"}</td>
                <td>J{r.junction}</td>
                <td>{r.vehicles}</td>
                <td>{r.nearby_events}</td>
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
            {!filtered.length ? (
              <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">{isLoading ? "Loading…" : "No matching predictions."}</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
