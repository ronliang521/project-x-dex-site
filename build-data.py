#!/usr/bin/env python3
"""Regenerate data.json from ../project-x-dex-volume-daily.csv"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT.parent / "project-x-dex-volume-daily.csv"
OUT = ROOT / "data.json"


def main():
    rows = []
    with open(CSV_PATH, newline="") as f:
        for r in csv.DictReader(f):
            dod = r["dod_change_pct"].strip()
            rows.append(
                {
                    "date": r["date_utc"],
                    "volumeUsd": int(r["dex_volume_usd"]),
                    "dodPct": None if dod == "" else float(dod),
                }
            )
    payload = {
        "source": "DeFiLlama summary/dexs/project-x",
        "unit": "USD",
        "rows": rows,
    }
    OUT.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(rows)} rows -> {OUT}")


if __name__ == "__main__":
    main()
