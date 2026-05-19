"""
Smart Traffic Density — Full ML pipeline
Bagging (RandomForest) + Boosting (XGBoost) → Soft VotingClassifier
with SMOTE, stratified CV and GridSearchCV.

Run:
    pip install -r requirements.txt
    python train.py
Outputs:
    traffic.pkl    — fitted ensemble
    metrics.json   — evaluation report
"""
from __future__ import annotations
import json, joblib, numpy as np, pandas as pd
from pathlib import Path
from sklearn.model_selection import StratifiedKFold, train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, confusion_matrix,
                             classification_report)
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier

from preprocessing import clean, engineer_features

DATA = Path(__file__).parent / "data" / "traffic.csv"
OUT_MODEL = Path(__file__).parent / "traffic.pkl"
OUT_METRICS = Path(__file__).parent / "metrics.json"


def load_dataset() -> pd.DataFrame:
    if DATA.exists():
        return pd.read_csv(DATA)
    # Synthetic fallback so the pipeline runs out of the box.
    rng = np.random.default_rng(7)
    n = 4000
    df = pd.DataFrame({
        "hour": rng.integers(0, 24, n),
        "day_of_week": rng.integers(0, 7, n),
        "temperature": rng.normal(28, 6, n).round(1),
        "rain": rng.integers(0, 4, n),
        "holiday": rng.integers(0, 2, n),
        "junction": rng.integers(1, 5, n),
        "vehicles": rng.integers(20, 400, n),
        "nearby_events": rng.integers(0, 3, n),
    })
    score = (df.vehicles / 80 + ((df.hour.between(7, 10) | df.hour.between(16, 19)).astype(int)) * 1.2
             + df.rain * 0.6 + df.nearby_events * 0.8 - df.holiday * 0.3)
    df["density"] = pd.cut(score, bins=[-1, 2.2, 3.6, 99], labels=["Low", "Medium", "High"])
    return df


def main():
    df = load_dataset()
    df = clean(df)
    df = engineer_features(df)

    y = LabelEncoder().fit_transform(df["density"])
    X = df.drop(columns=["density"])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42)

    scaler = StandardScaler().fit(X_train)
    X_train_s = scaler.transform(X_train)
    X_test_s = scaler.transform(X_test)

    # SMOTE applied on TRAIN ONLY → no leakage
    X_res, y_res = SMOTE(random_state=42).fit_resample(X_train_s, y_train)

    rf = RandomForestClassifier(random_state=42, n_jobs=-1)
    xgb = XGBClassifier(random_state=42, n_jobs=-1, eval_metric="mlogloss",
                        use_label_encoder=False)

    grid_rf = GridSearchCV(rf, {"n_estimators": [200, 400], "max_depth": [None, 12]},
                           cv=StratifiedKFold(5), n_jobs=-1).fit(X_res, y_res)
    grid_xgb = GridSearchCV(xgb, {"n_estimators": [200, 400], "max_depth": [4, 6],
                                  "learning_rate": [0.05, 0.1]},
                            cv=StratifiedKFold(5), n_jobs=-1).fit(X_res, y_res)

    ensemble = VotingClassifier(
        estimators=[("rf", grid_rf.best_estimator_), ("xgb", grid_xgb.best_estimator_)],
        voting="soft", n_jobs=-1).fit(X_res, y_res)

    proba = ensemble.predict_proba(X_test_s)
    preds = ensemble.predict(X_test_s)

    metrics = {
        "accuracy": float(accuracy_score(y_test, preds)),
        "precision_macro": float(precision_score(y_test, preds, average="macro")),
        "recall_macro": float(recall_score(y_test, preds, average="macro")),
        "f1_macro": float(f1_score(y_test, preds, average="macro")),
        "roc_auc_ovr": float(roc_auc_score(y_test, proba, multi_class="ovr")),
        "confusion_matrix": confusion_matrix(y_test, preds).tolist(),
        "report": classification_report(y_test, preds, output_dict=True),
        "best_rf": grid_rf.best_params_,
        "best_xgb": grid_xgb.best_params_,
    }
    joblib.dump({"model": ensemble, "scaler": scaler, "columns": list(X.columns)}, OUT_MODEL)
    OUT_METRICS.write_text(json.dumps(metrics, indent=2))
    print("Saved", OUT_MODEL, "metrics:", metrics["accuracy"])


if __name__ == "__main__":
    main()
