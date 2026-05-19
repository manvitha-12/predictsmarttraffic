"""FastAPI inference server. Loads traffic.pkl produced by train.py.

Run:
    uvicorn server:app --reload --port 8000
POST /predict
{"hour":8,"day_of_week":1,"temperature":30,"vehicles":250,
 "holiday":0,"rain":1,"junction":2,"nearby_events":0}
→ {"prediction":"High","confidence":0.83}
"""
from __future__ import annotations
import joblib, pandas as pd
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from preprocessing import engineer_features

LABELS = ["High", "Low", "Medium"]  # sklearn LabelEncoder sorts alphabetically

app = FastAPI(title="SmartTraffic API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

bundle = joblib.load(Path(__file__).parent / "traffic.pkl")
model, scaler, columns = bundle["model"], bundle["scaler"], bundle["columns"]


class Features(BaseModel):
    hour: int = Field(ge=0, le=23)
    day_of_week: int = Field(0, ge=0, le=6)
    temperature: float
    rain: int = Field(0, ge=0, le=5)
    holiday: int = Field(0, ge=0, le=1)
    junction: int = Field(1, ge=1, le=10)
    vehicles: int = Field(ge=0)
    nearby_events: int = Field(0, ge=0, le=10)


@app.get("/")
def health():
    return {"status": "ok", "model": "RF+XGB voting ensemble"}


@app.post("/predict")
def predict(f: Features):
    row = pd.DataFrame([f.model_dump()])
    row = engineer_features(row)[columns]
    X = scaler.transform(row)
    proba = model.predict_proba(X)[0]
    idx = int(proba.argmax())
    return {"prediction": LABELS[idx], "confidence": float(proba[idx])}
