#!/usr/bin/env python3
"""
Inference utility for attrition model trained on PCA features.

Usage examples:
    # Predict for an existing PCA CSV (e.g. validation set)
    python dataset/infer_attrition.py \
        --model dataset/models/attrition_lr.joblib \
        --input dataset/val_quit.csv \
        --output dataset/val_quit_with_scores.csv

    # Predict for a single PCA vector (JSON)
    python dataset/infer_attrition.py \
        --model dataset/models/attrition_lr.joblib \
        --sample '{"component_1":0.12,"component_2":-0.34,...}'
"""

import argparse
import json
import pathlib

import joblib
import numpy as np
import pandas as pd


def parse_args():
    parser = argparse.ArgumentParser(description="Run inference using trained attrition model")
    parser.add_argument("--model", type=pathlib.Path, required=True, help="Path to joblib model")

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--input",
        type=pathlib.Path,
        help="CSV file containing PCA components (component_* columns). Outputs CSV with predictions",
    )
    group.add_argument(
        "--sample",
        type=str,
        help="Single JSON object of PCA components to predict (prints result to stdout)",
    )

    parser.add_argument(
        "--output",
        type=pathlib.Path,
        help="CSV path to save predictions when using --input",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.5,
        help="Probability threshold for class label (default 0.5)",
    )
    return parser.parse_args()


def load_model(path):
    bundle = joblib.load(path)
    scaler = bundle["scaler"]
    model = bundle["model"]
    return scaler, model


def predict_df(df, scaler, model, threshold):
    feature_cols = [col for col in df.columns if col.startswith("component_")]
    X = df[feature_cols].values
    X_scaled = scaler.transform(X)
    probs = model.predict_proba(X_scaled)[:, 1]
    labels = (probs >= threshold).astype(int)
    result = df.copy()
    result["prob_quit"] = probs
    result["pred_label"] = labels
    return result


def main():
    args = parse_args()
    scaler, model = load_model(args.model)

    if args.input:
        df = pd.read_csv(args.input)
        result = predict_df(df, scaler, model, args.threshold)
        output_path = args.output or args.input.with_suffix(".predictions.csv")
        result.to_csv(output_path, index=False, encoding="utf-8")
        print(f"Predictions saved to {output_path}")
    else:
        sample = json.loads(args.sample)
        df = pd.DataFrame([sample])
        result = predict_df(df, scaler, model, args.threshold)
        print(json.dumps(result[["prob_quit", "pred_label"]].iloc[0].to_dict(), indent=2))


if __name__ == "__main__":
    main()

