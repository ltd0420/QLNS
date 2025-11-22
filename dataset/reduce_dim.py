#!/usr/bin/env python3
"""
Dimensionality reduction for cleaned ai_model_metadata dataset.

Example:
    python dataset/reduce_dim.py \
        --input dataset/test.ai_model_metadata.clean.json \
        --output dataset/test.ai_model_metadata.pca.csv \
        --method pca --components 20
"""

import argparse
import json
import pathlib

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def parse_args():
    parser = argparse.ArgumentParser(description="Dimensionality reduction for HR dataset")
    parser.add_argument(
        "--input",
        required=True,
        type=pathlib.Path,
        help="Path to cleaned NDJSON (one JSON object per line)",
    )
    parser.add_argument(
        "--output",
        required=True,
        type=pathlib.Path,
        help="Path to write reduced CSV",
    )
    parser.add_argument(
        "--method",
        choices=["pca"],
        default="pca",
        help="Reduction method",
    )
    parser.add_argument(
        "--components",
        type=int,
        default=20,
        help="Number of output components (for PCA)",
    )
    return parser.parse_args()


def load_records(path: pathlib.Path):
    records = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            records.append(json.loads(line))
    return records


IMPORTANT_CATEGORICAL = [
    "loai_mo_hinh",
    "ung_dung",
    "trang_thai",
    "ca_nhan_phong_ban",
    "cong_viec_vi_tri_cong_viec",
    "cong_viec_cap_bac",
]

IMPORTANT_NUMERIC = [
    "accuracy",
    "f1_score",
    "ca_nhan_tuoi",
    "ca_nhan_so_nam_lam_viec",
    "cong_viec_muc_luong_hien_tai",
    "cong_viec_so_gio_moi_tuan",
    "cong_viec_gio_ot",
    "cong_viec_so_du_an_tham_gia",
    "hieu_suat_diem_kpi",
    "hieu_suat_gio_dao_tao",
    "hieu_suat_so_lan_thang_chuc",
    "hieu_suat_thang_tu_lan_thang_chuc_cuoi",
    "phuc_loi_muc_do_hai_long",
    "phuc_loi_can_bang_cong_viec",
    "phuc_loi_so_ngay_nghi_phep",
    "phuc_loi_so_lan_di_muon",
    "phuc_loi_diem_gan_ket",
]


def flatten_record(record):
    base = {
        "ten_mo_hinh": record["ten_mo_hinh"],
        "phien_ban": record["phien_ban"],
        "loai_mo_hinh": record["loai_mo_hinh"],
        "ung_dung": record["ung_dung"],
        "accuracy": record["accuracy"],
        "f1_score": record["f1_score"],
        "trang_thai": record["trang_thai"],
    }
    dl = record["du_lieu_gia_lap"]
    personal = dl["thong_tin_ca_nhan"]
    job = dl["thong_tin_cong_viec"]
    perf = dl["thong_tin_hieu_suat"]
    wellbeing = dl["thai_do_phuc_loi"]

    for prefix, data in [
        ("ca_nhan", personal),
        ("cong_viec", job),
        ("hieu_suat", perf),
        ("phuc_loi", wellbeing),
    ]:
        for key, value in data.items():
            base[f"{prefix}_{key}"] = value
    return base


def reduce_pca(df, n_components):
    numeric_cols = [col for col in IMPORTANT_NUMERIC if col in df.columns]
    categorical_cols = [col for col in IMPORTANT_CATEGORICAL if col in df.columns]

    scaler = StandardScaler()
    scaled_numeric = scaler.fit_transform(df[numeric_cols])

    encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
    encoded_cat = encoder.fit_transform(df[categorical_cols])

    combined = np.hstack([scaled_numeric, encoded_cat])

    pca = PCA(n_components=n_components, random_state=42)
    reduced = pca.fit_transform(combined)

    components = [f"component_{i+1}" for i in range(n_components)]
    reduced_df = pd.DataFrame(reduced, columns=components)
    reduced_df["ten_mo_hinh"] = df["ten_mo_hinh"]
    reduced_df["phien_ban"] = df["phien_ban"]

    meta = {
        "explained_variance_ratio": pca.explained_variance_ratio_.tolist(),
        "n_original_features": combined.shape[1],
    }
    return reduced_df, meta


def main():
    args = parse_args()
    records = load_records(args.input)
    flattened = [flatten_record(r) for r in records]
    df = pd.DataFrame(flattened)

    if args.method == "pca":
        reduced_df, meta = reduce_pca(df, args.components)
    else:
        raise NotImplementedError(f"Method {args.method} not supported yet.")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    reduced_df.to_csv(args.output, index=False, encoding="utf-8")

    meta_path = args.output.with_suffix(args.output.suffix + ".meta.json")
    with meta_path.open("w", encoding="utf-8") as handle:
        json.dump(meta, handle, indent=2)

    print(f"Reduced dataset saved to {args.output}")
    print(f"Metadata saved to {meta_path}")
    print(f"Original samples: {len(df):,}")
    print(f"PCA components shape: {reduced_df.shape}")


if __name__ == "__main__":
    main()

