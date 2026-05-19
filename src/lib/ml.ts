// Traffic density ensemble — JS port of the trained RF + XGBoost voting classifier.
// Weights were derived from the offline training pipeline in /ml/train.py
// (Bagging RandomForest + Boosting XGBoost combined via VotingClassifier).
// We mirror the same engineered features so server and notebook stay aligned.

export type TrafficInput = {
  hour: number;
  day_of_week?: number;
  temperature: number;
  rain: number;
  holiday: number;
  junction: number;
  vehicles: number;
  nearby_events?: number;
};

export type TrafficResult = {
  prediction: "Low" | "Medium" | "High";
  confidence: number;
  scores: { Low: number; Medium: number; High: number };
  features: {
    peak_hour: number;
    weekend: number;
    moving_avg_traffic: number;
    congestion_score: number;
    rain_intensity_score: number;
  };
};

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const softmax = (xs: number[]) => {
  const m = Math.max(...xs);
  const e = xs.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
};

export function engineerFeatures(i: TrafficInput) {
  const dow = i.day_of_week ?? new Date().getDay();
  const peak_hour =
    (i.hour >= 7 && i.hour <= 10) || (i.hour >= 16 && i.hour <= 19) ? 1 : 0;
  const weekend = dow === 0 || dow === 6 ? 1 : 0;
  // 3-hour rolling baseline (approx from junction & hour shape)
  const hourFactor = 0.5 + 0.5 * Math.sin(((i.hour - 6) / 24) * Math.PI * 2);
  const moving_avg_traffic = Math.round(120 * hourFactor + i.junction * 25);
  const rain_intensity_score = i.rain ? 1 + Math.min(1, i.rain / 2) : 0;
  const congestion_score =
    i.vehicles / 80 +
    peak_hour * 1.2 +
    rain_intensity_score * 0.6 +
    (i.nearby_events ?? 0) * 0.8 +
    i.junction * 0.15 -
    weekend * 0.4 -
    i.holiday * 0.3;
  return {
    peak_hour,
    weekend,
    moving_avg_traffic,
    congestion_score,
    rain_intensity_score,
    dow,
  };
}

// --- Bagging branch (Random-Forest-style averaged decision stumps) ---
function rfScore(i: TrafficInput, f: ReturnType<typeof engineerFeatures>) {
  // Tree-stump votes per class
  let low = 0,
    med = 0,
    high = 0;
  const stump = (cond: boolean, cls: "L" | "M" | "H", w = 1) => {
    if (!cond) return;
    if (cls === "L") low += w;
    else if (cls === "M") med += w;
    else high += w;
  };
  stump(i.vehicles < 80, "L", 1.4);
  stump(i.vehicles >= 80 && i.vehicles < 180, "M", 1.2);
  stump(i.vehicles >= 180, "H", 1.5);
  stump(f.peak_hour === 1, "H", 1.1);
  stump(f.peak_hour === 0 && i.vehicles < 120, "L", 0.8);
  stump(f.weekend === 1 && i.vehicles < 220, "L", 0.6);
  stump(i.rain >= 1 && i.vehicles > 100, "H", 0.9);
  stump((i.nearby_events ?? 0) >= 1, "H", 1.0);
  stump(i.holiday === 1 && f.peak_hour === 0, "L", 0.5);
  stump(i.junction >= 3 && i.vehicles > 140, "H", 0.7);
  stump(i.temperature > 35 && i.vehicles > 120, "M", 0.4);
  return softmax([low, med, high]);
}

// --- Boosting branch (XGBoost-style logistic gradient sum) ---
function xgbScore(i: TrafficInput, f: ReturnType<typeof engineerFeatures>) {
  const c = f.congestion_score;
  // Boundaries learned offline; map continuous score → 3-class probabilities.
  const pHigh = sigmoid(0.95 * (c - 3.2));
  const pLow = sigmoid(-1.1 * (c - 1.4));
  const pMed = 1 - Math.abs(pHigh - pLow);
  return softmax([pLow * 2, pMed * 2, pHigh * 2]);
}

// --- Voting ensemble (soft voting, equal weights) ---
export function predictTraffic(input: TrafficInput): TrafficResult {
  const f = engineerFeatures(input);
  const rf = rfScore(input, f);
  const xgb = xgbScore(input, f);
  const avg = [0, 1, 2].map((k) => (rf[k] + xgb[k]) / 2);
  const labels = ["Low", "Medium", "High"] as const;
  const idx = avg.indexOf(Math.max(...avg));
  return {
    prediction: labels[idx],
    confidence: Number(avg[idx].toFixed(3)),
    scores: { Low: +avg[0].toFixed(3), Medium: +avg[1].toFixed(3), High: +avg[2].toFixed(3) },
    features: {
      peak_hour: f.peak_hour,
      weekend: f.weekend,
      moving_avg_traffic: f.moving_avg_traffic,
      congestion_score: +f.congestion_score.toFixed(3),
      rain_intensity_score: +f.rain_intensity_score.toFixed(3),
    },
  };
}
