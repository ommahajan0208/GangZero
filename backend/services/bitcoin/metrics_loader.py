"""
Loads pre-computed Bitcoin model evaluation metrics from JSON.
"""
import json
from pathlib import Path


def load_bitcoin_metrics(precomputed_dir: Path) -> dict:
    path = precomputed_dir / "bitcoin_metrics.json"
    with open(path) as f:
        return json.load(f)
