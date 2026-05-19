import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useServerFn } from "@tanstack/react-start";
import { predictTrafficFn } from "@/lib/predictions.functions";
import type { TrafficResult } from "@/lib/ml";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function TrafficForm({ onResult }: { onResult: (r: TrafficResult) => void }) {
  const predict = useServerFn(predictTrafficFn);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    hour: 8,
    day_of_week: new Date().getDay(),
    temperature: 28,
    rain: 0,
    holiday: 0,
    junction: 2,
    vehicles: 240,
    nearby_events: 0,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await predict({ data: form });
      onResult(r);
      toast.success(`Prediction: ${r.prediction}`);
    } catch (err) {
      console.error(err);
      toast.error("Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass rounded-3xl p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label={`Hour: ${form.hour}:00`}>
          <Slider value={[form.hour]} min={0} max={23} step={1} onValueChange={([v]) => set("hour", v)} />
        </Field>
        <Field label={`Day of week`}>
          <select
            value={form.day_of_week}
            onChange={(e) => set("day_of_week", Number(e.target.value))}
            className="h-10 w-full rounded-md border bg-input/40 px-3 text-sm"
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label={`Temperature (°C): ${form.temperature}`}>
          <Slider value={[form.temperature]} min={-10} max={50} step={1} onValueChange={([v]) => set("temperature", v)} />
        </Field>
        <Field label={`Vehicles last hour`}>
          <Input
            type="number"
            min={0}
            max={5000}
            value={form.vehicles}
            onChange={(e) => set("vehicles", Number(e.target.value))}
          />
        </Field>
        <Field label={`Junction #`}>
          <Input
            type="number"
            min={1}
            max={10}
            value={form.junction}
            onChange={(e) => set("junction", Number(e.target.value))}
          />
        </Field>
        <Field label={`Nearby events`}>
          <Input
            type="number"
            min={0}
            max={10}
            value={form.nearby_events}
            onChange={(e) => set("nearby_events", Number(e.target.value))}
          />
        </Field>
        <Field label="Rain (0–5)">
          <Slider value={[form.rain]} min={0} max={5} step={1} onValueChange={([v]) => set("rain", v)} />
        </Field>
        <div className="flex items-end gap-3">
          <Label className="flex items-center gap-2 text-sm">
            <Switch checked={!!form.holiday} onCheckedChange={(v) => set("holiday", v ? 1 : 0)} />
            Public holiday
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={loading} size="lg" className="w-full btn-glow bg-[image:var(--gradient-primary)]">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        Predict traffic density
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
