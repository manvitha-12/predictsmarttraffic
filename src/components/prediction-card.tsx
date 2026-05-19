import { cn } from "@/lib/utils";
import type { TrafficResult } from "@/lib/ml";
import { TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

const map = {
  Low: { tone: "from-emerald-500/30 to-emerald-400/10", icon: CheckCircle2, label: "Low congestion" },
  Medium: { tone: "from-amber-500/30 to-amber-400/10", icon: TrendingUp, label: "Moderate congestion" },
  High: { tone: "from-rose-500/30 to-rose-400/10", icon: AlertTriangle, label: "Heavy congestion" },
} as const;

export function PredictionCard({ result }: { result: TrafficResult }) {
  const meta = map[result.prediction];
  const Icon = meta.icon;
  return (
    <div className={cn("glass rounded-3xl p-6 bg-gradient-to-br", meta.tone)}>
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Prediction</div>
          <div className="text-3xl font-semibold">{result.prediction}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-muted-foreground">Confidence</div>
          <div className="text-2xl font-semibold">{(result.confidence * 100).toFixed(0)}%</div>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{meta.label} expected at this junction.</p>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        {(["Low", "Medium", "High"] as const).map((k) => (
          <div key={k} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
            <div className="text-lg font-semibold">{(result.scores[k] * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
