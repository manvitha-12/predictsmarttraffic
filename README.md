# SmartTraffic — AI Traffic Density Prediction

Full-stack AI app that predicts **Low / Medium / High** traffic density at a
junction using a **Random Forest + XGBoost soft voting ensemble**.

## Architecture (as built in this Lovable project)

- **Frontend**: TanStack Start (React + Vite), TailwindCSS, Recharts
- **Backend**: TanStack server functions (`createServerFn`) — same runtime as
  the frontend; serves the equivalent of the requested FastAPI `/predict` and
  `/history` endpoints with the trained ensemble logic ported to TypeScript
  in `src/lib/ml.ts`.
- **Database**: Lovable Cloud (managed Postgres) — `predictions` table for history.
- **Auth**: none (public demo).

> The original spec asked for Next.js + FastAPI. This project's runtime is
> TanStack Start on Cloudflare Workers, so the same product is delivered on
> that stack. The full Python pipeline (RF + XGBoost + SMOTE + GridSearchCV
> + VotingClassifier) is included under `/ml` for retraining offline.

## Pages

- `/` — hero + feature overview
- `/dashboard` — live stats, charts, recent predictions
- `/prediction` — interactive form, runs ensemble in real time
- `/analytics` — rain impact, peak hours, model card
- `/history` — searchable prediction log

## ML pipeline (`/ml`)

```
Dataset → Cleaning → Preprocessing → Feature Engineering →
Bias Prevention (Stratified split + SMOTE + CV) →
Bagging (RandomForest) + Boosting (XGBoost) → Voting Ensemble →
GridSearchCV → Evaluation (Accuracy / Precision / Recall / F1 / ROC-AUC) →
Export → FastAPI (server.py) → Frontend → Database
```

Run the training pipeline:

```bash
cd ml
pip install -r requirements.txt
python train.py             # writes traffic.pkl + metrics.json
uvicorn server:app --reload # exposes POST /predict
```

POST `http://localhost:8000/predict`:

```json
{ "hour": 8, "temperature": 30, "vehicles": 250,
  "holiday": 0, "rain": 1, "junction": 2 }
```

→

```json
{ "prediction": "High", "confidence": 0.83 }
```

## Web app

In Lovable the dev server runs automatically. Locally:

```bash
bun install
bun run dev
```

Build & deploy: use the **Publish** button in Lovable. Backend (server fns)
and database are managed by Lovable Cloud and deploy with the app.
