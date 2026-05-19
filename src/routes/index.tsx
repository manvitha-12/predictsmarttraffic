import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, Brain, Cpu, Gauge, LineChart, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartTraffic — AI Traffic Density Prediction" },
      { name: "description", content: "Predict Low / Medium / High traffic congestion using a Random Forest + XGBoost voting ensemble." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <section className="relative">
        <div className="glass rounded-3xl p-10 sm:p-14 overflow-hidden relative">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-primary" /> Live ML inference
            </div>
            <h1 className="mt-5 text-4xl sm:text-6xl font-semibold tracking-tight">
              Predict <span className="text-gradient">traffic density</span><br /> before it happens.
            </h1>
            <p className="mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground">
              SmartTraffic blends Random Forest bagging with XGBoost boosting in a soft-voting ensemble to forecast Low, Medium, or High congestion in real time — with engineered features for peak hours, weather, holidays, and nearby events.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="btn-glow bg-[image:var(--gradient-primary)]">
                <Link to="/prediction">Try a prediction <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/dashboard">Open dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Brain, title: "Voting Ensemble", desc: "RandomForest + XGBoost soft voting" },
          { icon: Cpu, title: "Feature engineered", desc: "Peak hour, rain intensity, congestion score" },
          { icon: ShieldCheck, title: "Bias prevention", desc: "Stratified split + SMOTE + CV" },
          { icon: Gauge, title: "Real-time API", desc: "Server-fn /predict + history store" },
        ].map((f) => (
          <div key={f.title} className="glass rounded-2xl p-5">
            <f.icon className="h-6 w-6 text-primary" />
            <div className="mt-3 font-semibold">{f.title}</div>
            <div className="text-sm text-muted-foreground">{f.desc}</div>
          </div>
        ))}
      </section>

      <section className="mt-12 glass rounded-3xl p-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <LineChart className="h-4 w-4" /> Pipeline
        </div>
        <h2 className="mt-2 text-2xl font-semibold">Full ML pipeline, end to end</h2>
        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          {[
            "Dataset", "Cleaning", "Preprocessing", "Feature Engineering", "Bias Prevention",
            "SMOTE", "Train/Test Split", "Bagging RF", "Boosting XGB", "Voting Ensemble",
            "GridSearchCV", "Evaluation", "Export Model", "API", "Dashboard", "Database",
          ].map((s) => (
            <span key={s} className="rounded-full border border-border/60 bg-white/5 px-3 py-1">{s}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
