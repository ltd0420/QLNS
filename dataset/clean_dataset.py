#!/usr/bin/env python3
"""
Utility script to clean the exported ai_model_metadata dataset.

Usage
-----
python dataset/clean_dataset.py \
    --input dataset/test.ai_model_metadata.json \
    --output dataset/test.ai_model_metadata.clean.json

The script accepts JSON array or newline-delimited JSON (one object per line)
and always writes the cleaned output as newline-delimited JSON to avoid
loading the entire dataset into memory.
"""

import argparse
import json
import math
import pathlib
from datetime import datetime


ALLOWED_MODEL_TYPES = {"BERT", "CNN", "Hybrid"}
ALLOWED_USE_CASES = {
    "Dự báo nghỉ việc",
    "Phát hiện burnout",
    "Dự đoán khiếu nại nội bộ",
    "Dự báo yêu cầu tăng lương",
    "Chấm điểm khảo sát gắn kết",
    "Dự đoán KPI sắp tới",
    "Phân tích cảm xúc phản hồi khách hàng",
    "Dự báo tham gia đào tạo",
    "Cảnh báo tăng ca bất thường",
    "Theo dõi trượt hiệu suất",
}
ALLOWED_STATUS = {"Active", "Testing", "Deprecated"}
ALLOWED_GENDER = {"Nam", "Nữ", "Khác"}
ALLOWED_MARITAL = {"Độc thân", "Đã kết hôn", "Khác"}


def parse_args():
    parser = argparse.ArgumentParser(description="Clean ai_model_metadata dataset")
    parser.add_argument(
        "--input",
        default="dataset/test.ai_model_metadata.json",
        type=pathlib.Path,
        help="Path to source JSON/NDJSON file",
    )
    parser.add_argument(
        "--output",
        default="dataset/test.ai_model_metadata.clean.json",
        type=pathlib.Path,
        help="Path to write cleaned NDJSON output",
    )
    parser.add_argument(
        "--dedupe",
        action="store_true",
        help="Drop duplicate records based on (ten_mo_hinh, phien_ban)",
    )
    return parser.parse_args()


def iter_records(path: pathlib.Path):
    with path.open("r", encoding="utf-8") as handle:
        preview = ""
        while True:
            ch = handle.read(1)
            if not ch:
                break
            if not ch.isspace():
                preview = ch
                break
        handle.seek(0)
        if preview == "[":
            data = json.load(handle)
            for item in data:
                yield item
        else:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                yield json.loads(line)


def normalize_string(value, *, allow_empty=False):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        value = str(value)
    if isinstance(value, str):
        cleaned = value.strip()
        if cleaned or allow_empty:
            return cleaned
    return None


def clamp_number(value, *, min_value=None, max_value=None, default=None):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if math.isnan(number):
        return default
    if min_value is not None and number < min_value:
        number = min_value
    if max_value is not None and number > max_value:
        number = max_value
    return number


def normalize_datetime(value):
    text = normalize_string(value)
    if not text:
        return None
    try:
        # Support timestamps ending with Z
        if text.endswith("Z"):
            dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
        else:
            dt = datetime.fromisoformat(text)
        return dt.isoformat()
    except ValueError:
        return text  # keep original if parsing fails


def clean_record(record):
    cleaned = {}

    ten_mo_hinh = normalize_string(record.get("ten_mo_hinh"))
    phien_ban = normalize_string(record.get("phien_ban"))
    if not ten_mo_hinh or not phien_ban:
        return None

    loai = normalize_string(record.get("loai_mo_hinh"))
    ung_dung = normalize_string(record.get("ung_dung"))
    if loai not in ALLOWED_MODEL_TYPES or ung_dung not in ALLOWED_USE_CASES:
        return None

    trang_thai = normalize_string(record.get("trang_thai"))
    if trang_thai not in ALLOWED_STATUS:
        return None

    accuracy = clamp_number(record.get("accuracy"), min_value=0.0, max_value=1.0)
    f1_score = clamp_number(record.get("f1_score"), min_value=0.0, max_value=1.0)
    if accuracy is None or f1_score is None:
        return None

    mo_ta_model_uri = normalize_string(record.get("mo_ta_model_uri"))
    tom_tat = normalize_string(record.get("tom_tat_du_lieu"), allow_empty=True)

    cleaned.update(
        {
            "ten_mo_hinh": ten_mo_hinh,
            "phien_ban": phien_ban,
            "loai_mo_hinh": loai,
            "ung_dung": ung_dung,
            "tom_tat_du_lieu": tom_tat,
            "accuracy": accuracy,
            "f1_score": f1_score,
            "mo_ta_model_uri": mo_ta_model_uri,
            "last_trained": normalize_datetime(record.get("last_trained")),
            "trang_thai": trang_thai,
        }
    )

    du_lieu_gia_lap = record.get("du_lieu_gia_lap") or {}
    personal = du_lieu_gia_lap.get("thong_tin_ca_nhan") or {}
    job = du_lieu_gia_lap.get("thong_tin_cong_viec") or {}
    performance = du_lieu_gia_lap.get("thong_tin_hieu_suat") or {}
    wellbeing = du_lieu_gia_lap.get("thai_do_phuc_loi") or {}

    age = clamp_number(personal.get("tuoi"), min_value=18, max_value=70)
    years = clamp_number(personal.get("so_nam_lam_viec"), min_value=0, max_value=50)
    salary = clamp_number(job.get("muc_luong_hien_tai"), min_value=0)
    hours = clamp_number(job.get("so_gio_moi_tuan"), min_value=0, max_value=80)

    if age is None or salary is None or hours is None:
        return None

    gender = normalize_string(personal.get("gioi_tinh"))
    marital = normalize_string(personal.get("tinh_trang_hon_nhan"))
    if gender not in ALLOWED_GENDER or marital not in ALLOWED_MARITAL:
        return None

    cleaned["du_lieu_gia_lap"] = {
        "thong_tin_ca_nhan": {
            "ma_nhan_vien": normalize_string(personal.get("ma_nhan_vien")),
            "tuoi": age,
            "gioi_tinh": gender,
            "trinh_do_hoc_van": normalize_string(personal.get("trinh_do_hoc_van")),
            "tinh_trang_hon_nhan": marital,
            "so_nam_lam_viec": years,
            "phong_ban": normalize_string(personal.get("phong_ban")),
        },
        "thong_tin_cong_viec": {
            "vi_tri_cong_viec": normalize_string(job.get("vi_tri_cong_viec")),
            "cap_bac": normalize_string(job.get("cap_bac")),
            "muc_luong_hien_tai": salary,
            "tang_luong_nam_truoc": clamp_number(job.get("tang_luong_nam_truoc"), min_value=0, max_value=100, default=0),
            "so_gio_moi_tuan": hours,
            "gio_ot": clamp_number(job.get("gio_ot"), min_value=0, max_value=120, default=0),
            "so_du_an_tham_gia": clamp_number(job.get("so_du_an_tham_gia"), min_value=0, max_value=50, default=0),
            "ma_quan_ly": normalize_string(job.get("ma_quan_ly")),
        },
        "thong_tin_hieu_suat": {
            "diem_kpi": clamp_number(performance.get("diem_kpi"), min_value=0, max_value=100, default=0),
            "xep_loai_hieu_suat": normalize_string(performance.get("xep_loai_hieu_suat")),
            "gio_dao_tao": clamp_number(performance.get("gio_dao_tao"), min_value=0, default=0),
            "so_lan_thang_chuc": clamp_number(performance.get("so_lan_thang_chuc"), min_value=0, default=0),
            "thang_tu_lan_thang_chuc_cuoi": clamp_number(
                performance.get("thang_tu_lan_thang_chuc_cuoi"), min_value=0, default=0
            ),
        },
        "thai_do_phuc_loi": {
            "muc_do_hai_long": clamp_number(wellbeing.get("muc_do_hai_long"), min_value=1, max_value=5, default=3),
            "can_bang_cong_viec": clamp_number(wellbeing.get("can_bang_cong_viec"), min_value=1, max_value=5, default=3),
            "so_ngay_nghi_phep": clamp_number(wellbeing.get("so_ngay_nghi_phep"), min_value=0, max_value=365, default=0),
            "so_lan_di_muon": clamp_number(wellbeing.get("so_lan_di_muon"), min_value=0, default=0),
            "diem_gan_ket": clamp_number(wellbeing.get("diem_gan_ket"), min_value=0, max_value=100, default=0),
            "ket_qua_khao_sat": normalize_string(wellbeing.get("ket_qua_khao_sat")),
        },
    }

    cleaned["createdAt"] = normalize_datetime(record.get("createdAt"))
    cleaned["updatedAt"] = normalize_datetime(record.get("updatedAt"))
    return cleaned


def main():
    args = parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)

    total = kept = skipped = duplicates = 0
    seen_keys = set()

    with args.output.open("w", encoding="utf-8") as out:
        for record in iter_records(args.input):
            total += 1
            cleaned = clean_record(record)
            if not cleaned:
                skipped += 1
                continue

            dedupe_key = (cleaned["ten_mo_hinh"], cleaned["phien_ban"])
            if args.dedupe and dedupe_key in seen_keys:
                duplicates += 1
                continue
            seen_keys.add(dedupe_key)

            out.write(json.dumps(cleaned, ensure_ascii=False) + "\n")
            kept += 1

    print("Cleaning completed")
    print(f"Input records:   {total:,}")
    print(f"Kept records:    {kept:,}")
    print(f"Skipped invalid: {skipped:,}")
    if args.dedupe:
        print(f"Duplicate drops: {duplicates:,}")
    print(f"Output path:     {args.output}")


if __name__ == "__main__":
    main()

