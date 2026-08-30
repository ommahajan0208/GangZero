"""
Loads the three Elliptic CSV files into memory at startup.
Returns a dict used throughout the bitcoin services.
"""
import pandas as pd
import numpy as np
from pathlib import Path


def load_elliptic_data(data_dir: Path) -> dict:
    features_df = pd.read_csv(
        data_dir / "elliptic_txs_features.csv",
        header=None,
    )
    # Column 0 = txId, Column 1 = time_step, Columns 2..167 = features
    features_df.columns = (
        ["txId", "time_step"]
        + [f"local_feat_{i}" for i in range(94)]
        + [f"agg_feat_{i}" for i in range(71)]
    )
    features_df["txId"] = features_df["txId"].astype(str)

    classes_df = pd.read_csv(data_dir / "elliptic_txs_classes.csv")
    classes_df.columns = ["txId", "class"]
    classes_df["txId"] = classes_df["txId"].astype(str)
    # Normalize class labels: '1' = illicit, '2' = licit, 'unknown' = unknown
    classes_df["class"] = classes_df["class"].map(
        {"1": "illicit", "2": "licit", "unknown": "unknown"}
    )

    edgelist_df = pd.read_csv(data_dir / "elliptic_txs_edgelist.csv")
    edgelist_df.columns = ["txId1", "txId2"]
    edgelist_df = edgelist_df.astype(str)

    # Merge features + classes
    merged = features_df.merge(classes_df, on="txId", how="left")
    merged["class"] = merged["class"].fillna("unknown")

    # Build txId -> row index lookup for O(1) access
    tx_index = {row["txId"]: i for i, row in merged.iterrows()}

    # Build adjacency lookup (dict of list) for subgraph extraction
    adjacency: dict[str, list[str]] = {}
    for _, row in edgelist_df.iterrows():
        adjacency.setdefault(row["txId1"], []).append(row["txId2"])
        adjacency.setdefault(row["txId2"], []).append(row["txId1"])

    return {
        "features": merged,
        "edgelist": edgelist_df,
        "tx_index": tx_index,
        "adjacency": adjacency,
    }
