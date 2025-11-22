#!/usr/bin/env python3
"""
Train a simple attrition model on PCA features.

Example:
    python dataset/train_model.py \
        --train dataset/train_quit.csv \
        --val dataset/val_quit.csv \
        --model-out dataset/models/attrition_lr.joblib
"""

import argparse
import json
import pathlib

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    roc_auc_score,
)
from sklearn.preprocessing import StandardScaler


def parse_args():
    parser = argparse.ArgumentParser(description="Train attrition model on PCA features")
    parser.add_argument("--train", type=pathlib.Path, required=True, help="Train CSV path")
    parser.add_argument("--val", type=pathlib.Path, required=True, help="Validation CSV path")
    parser.add_argument(
        "--model-out",
        type=pathlib.Path,
        default=pathlib.Path("dataset/models/attrition_lr.joblib"),
        help="Path to save trained model",
    )
    parser.add_argument(
        "--metrics-out",
        type=pathlib.Path,
        default=pathlib.Path("dataset/models/attrition_metrics.json"),
        help="Path to save metrics JSON",
    )
    return parser.parse_args()


def load_dataset(path: pathlib.Path):
    df = pd.read_csv(path)
    feature_cols = [col for col in df.columns if col.startswith("component_")]
    X = df[feature_cols].values
    y = df["label"].values.astype(int)
    return X, y


def main():
    args = parse_args()
    X_train, y_train = load_dataset(args.train)
    X_val, y_val = load_dataset(args.val)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    model = LogisticRegression(max_iter=200, class_weight="balanced", n_jobs=None)
    model.fit(X_train_scaled, y_train)

    val_probs = model.predict_proba(X_val_scaled)[:, 1]
    val_preds = (val_probs >= 0.5).astype(int)

    metrics = {
        "accuracy": accuracy_score(y_val, val_preds),
        "f1": f1_score(y_val, val_preds),
        "roc_auc": roc_auc_score(y_val, val_probs),
        "confusion_matrix": confusion_matrix(y_val, val_preds).tolist(),
        "classification_report": classification_report(y_val, val_preds, output_dict=True),
    }

    args.model_out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"scaler": scaler, "model": model}, args.model_out)

    args.metrics_out.parent.mkdir(parents=True, exist_ok=True)
    with args.metrics_out.open("w", encoding="utf-8") as handle:
        json.dump(metrics, handle, indent=2)

    print(f"Model saved to {args.model_out}")
    print(f"Metrics saved to {args.metrics_out}")
    print("Validation scores:")
    print(f"  Accuracy : {metrics['accuracy']:.4f}")
    print(f"  F1-score : {metrics['f1']:.4f}")
    print(f"  ROC-AUC  : {metrics['roc_auc']:.4f}")


if __name__ == "__main__":
    main()

