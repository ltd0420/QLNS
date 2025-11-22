#!/usr/bin/env python3
"""
Prepare train/validation datasets by merging PCA components with labels.

Default behavior:
    - Label = 1 if `trang_thai == "Deprecated"`, else 0 (attrition risk).
    - Split: 80% train, 20% validation with stratify.

Usage example:
    python dataset/prepare_train_test.py \
        --clean dataset/test.ai_model_metadata.clean.json \
        --pca dataset/test.ai_model_metadata.pca.csv \
        --train-out dataset/train_quit.csv \
        --val-out dataset/val_quit.csv
"""

import argparse
import pathlib

import pandas as pd
from sklearn.model_selection import train_test_split


def parse_args():
    parser = argparse.ArgumentParser(description="Merge PCA features with labels and split train/val")
    parser.add_argument("--clean", type=pathlib.Path, required=True, help="Clean NDJSON file")
    parser.add_argument("--pca", type=pathlib.Path, required=True, help="PCA CSV file")
    parser.add_argument("--train-out", type=pathlib.Path, required=True, help="Output CSV for training set")
    parser.add_argument("--val-out", type=pathlib.Path, required=True, help="Output CSV for validation set")
    parser.add_argument("--test-size", type=float, default=0.2, help="Validation size ratio (default 0.2)")
    parser.add_argument(
        "--label-target",
        choices=["trang_thai"],
        default="trang_thai",
        help="Label definition to use (currently only trang_thai supported)",
    )
    return parser.parse_args()


def build_label(df):
    # Attrition label: Deprecated => 1, others => 0
    return (df["trang_thai"] == "Deprecated").astype(int)


def main():
    args = parse_args()
    clean_df = pd.read_json(args.clean, lines=True)
    pca_df = pd.read_csv(args.pca)

    target_cols = ["ten_mo_hinh", "phien_ban", "trang_thai"]
    merged = pca_df.merge(clean_df[target_cols], on=["ten_mo_hinh", "phien_ban"], how="inner")

    merged["label"] = build_label(merged)
    feature_cols = [col for col in merged.columns if col.startswith("component_")]
    dataset = merged[feature_cols + ["label"]]

    X = dataset[feature_cols]
    y = dataset["label"]

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=args.test_size, random_state=42, stratify=y
    )

    train_df = X_train.copy()
    train_df["label"] = y_train
    val_df = X_val.copy()
    val_df["label"] = y_val

    args.train_out.parent.mkdir(parents=True, exist_ok=True)
    args.val_out.parent.mkdir(parents=True, exist_ok=True)

    train_df.to_csv(args.train_out, index=False, encoding="utf-8")
    val_df.to_csv(args.val_out, index=False, encoding="utf-8")

    print(f"Train samples: {len(train_df):,} → {args.train_out}")
    print(f"Validation samples: {len(val_df):,} → {args.val_out}")
    print("Label definition: Deprecated=1, otherwise=0")


if __name__ == "__main__":
    main()

