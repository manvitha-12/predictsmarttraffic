import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TrafficForm } from "@/components/traffic-form";
import { PredictionCard } from "@/components/prediction-card";
import type { TrafficResult } from "@/lib/ml";

export const Route = createFileRoute("/prediction")({
  head: () => ({
    meta: [
      { title: "Predict — SmartTraffic" },
      { name: "description", content: "Run the traffic density prediction model with custom inputs." },
    ],
  }),
  component: PredictPage,
});

function PredictPage() {
  const [result, setResult] = useState<TrafficResult | null>(null);
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">New prediction</h1>
        <p className="text-sm text-muted-foreground">Enter conditions and run the RF + XGBoost voting ensemble.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <TrafficForm onResult={setResult} />
        <div className="space-y-5">
          {result ? (
            <>
              <PredictionCard result={result} />
              <div className="glass rounded-2xl p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  Engineered features
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(result.features).map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-border/50 bg-white/5 p-3">
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
                      <dd className="text-base font-semibold">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          ) : (
            <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
              <p>Submit the form to see the prediction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
