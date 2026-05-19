"""CLI prediction for a single input — sanity check the saved model."""
import json, sys, joblib, pandas as pd
from pathlib import Path
from preprocessing import engineer_features

LABELS = ["High", "Low", "Medium"]
bundle = joblib.load(Path(__file__).parent / "traffic.pkl")
model, scaler, columns = bundle["model"], bundle["scaler"], bundle["columns"]

def main(payload: dict):
    row = pd.DataFrame([payload])
    row = engineer_features(row)[columns]
    proba = model.predict_proba(scaler.transform(row))[0]
    idx = int(proba.argmax())
    print(json.dumps({"prediction": LABELS[idx], "confidence": float(proba[idx])}))

if __name__ == "__main__":
    payload = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {
        "hour": 8, "day_of_week": 1, "temperature": 30, "rain": 1,
        "holiday": 0, "junction": 2, "vehicles": 250, "nearby_events": 0,
    }
    main(payload)
