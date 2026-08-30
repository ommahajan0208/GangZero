"""
Detects suspicious transaction clusters using NetworkX connected components
and writes them to precomputed/bitcoin_clusters.json.

Usage:
    python scripts/precompute_clusters.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import json

from config import settings
from services.bitcoin.data_loader import load_elliptic_data
from services.bitcoin.cluster_detector import detect_clusters


def main():
    print("Loading data...")
    elliptic = load_elliptic_data(settings.ELLIPTIC_DATA_DIR)

    print("Loading predictions...")
    pred_path = settings.PRECOMPUTED_DIR / "bitcoin_predictions.json"
    if not pred_path.exists():
        raise FileNotFoundError(
            f"{pred_path} not found. Run precompute_predictions.py first."
        )
    with open(pred_path) as f:
        predictions = json.load(f)

    print("Detecting clusters...")
    clusters = detect_clusters(
        elliptic_data=elliptic,
        predictions=predictions,
        min_cluster_size=settings.MIN_CLUSTER_SIZE,
        illicit_ratio_threshold=settings.CLUSTER_ILLICIT_RATIO_THRESHOLD,
        avg_risk_threshold=settings.CLUSTER_AVG_RISK_THRESHOLD,
    )

    out_path = settings.PRECOMPUTED_DIR / "bitcoin_clusters.json"
    with open(out_path, "w") as f:
        json.dump(clusters, f, indent=2)

    print(f"Found {len(clusters)} suspicious clusters. Saved to {out_path}")


if __name__ == "__main__":
    main()
