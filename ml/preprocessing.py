"""Data cleaning + feature engineering shared by train.py and predict.py."""
from __future__ import annotations
import numpy as np
import pandas as pd


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.drop_duplicates().copy()
    # Missing values
    num_cols = df.select_dtypes(include=[np.number]).columns
    df[num_cols] = df[num_cols].fillna(df[num_cols].median())
    # Outlier clipping (IQR)
    for c in ["vehicles", "temperature"]:
        if c in df:
            q1, q3 = df[c].quantile([0.25, 0.75])
            iqr = q3 - q1
            df[c] = df[c].clip(q1 - 1.5 * iqr, q3 + 1.5 * iqr)
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["peak_hour"] = df["hour"].between(7, 10).astype(int) | df["hour"].between(16, 19).astype(int)
    df["weekend"] = df["day_of_week"].isin([0, 6]).astype(int)
    df["moving_avg_traffic"] = (
        df.groupby("junction")["vehicles"].transform(lambda s: s.rolling(3, min_periods=1).mean())
    )
    df["rain_intensity_score"] = np.where(df["rain"] > 0, 1 + np.minimum(1, df["rain"] / 2), 0)
    df["congestion_score"] = (
        df["vehicles"] / 80
        + df["peak_hour"] * 1.2
        + df["rain_intensity_score"] * 0.6
        + df.get("nearby_events", 0) * 0.8
        + df["junction"] * 0.15
        - df["weekend"] * 0.4
        - df["holiday"] * 0.3
    )
    return df
