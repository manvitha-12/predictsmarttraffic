import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHistoryFn } from "@/lib/predictions.functions";
import { CongestionBarChart, HourlyTrendChart } from "@/components/traffic-chart";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — SmartTraffic" },
      { name: "description", content: "Deep analytics on predicted traffic density: trends, weather impact, peak windows." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const fetchHistory = useServerFn(getHistoryFn);
  const { data } = useQuery({
    queryKey: ["history-analytics"],
    queryFn: () => fetchHistory({ data: { limit: 500 } }),
  });
  const rows = data?.rows ?? [];

  const rainImpact = [0, 1, 2, 3, 4, 5].map((r) => {
    const sample = rows.filter((x) => x.rain === r);
    const highShare = sample.length ? (sample.filter((x) => x.prediction === "High").length / sample.length) * 100 : 0;
    return { name: `R${r}`, value: Math.round(highShare) };
  });

  const peakHours = Array.from({ length: 24 }, (_, h) => {
    const sample = rows.filter((x) => x.hour === h);
    const high = sample.filter((x) => x.prediction === "High").length;
    return { hour: `${h}:00`, vehicles: high };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Pattern discovery across {rows.length} predictions.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h2 className="mb-3 font-semibold">High-congestion peak hours</h2>
          <HourlyTrendChart data={peakHours} />
        </div>
        <div className="glass rounded-3xl p-6">
          <h2 className="mb-3 font-semibold">Rain intensity → % High</h2>
          <CongestionBarChart data={rainImpact} />
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="font-semibold mb-3">Model card</h2>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          <li><strong>Algorithm:</strong> VotingClassifier (Random Forest + XGBoost), soft voting</li>
          <li><strong>Tuning:</strong> GridSearchCV with 5-fold stratified CV</li>
          <li><strong>Resampling:</strong> SMOTE on training fold only (no leakage)</li>
          <li><strong>Metrics:</strong> Accuracy, Precision, Recall, F1, ROC-AUC (one-vs-rest)</li>
          <li><strong>Features:</strong> hour, day_of_week, temperature, rain, holiday, junction, vehicles, nearby_events</li>
          <li><strong>Engineered:</strong> peak_hour, weekend, moving_avg_traffic, congestion_score, rain_intensity_score</li>
        </ul>
      </div>
    </div>
  );
}
