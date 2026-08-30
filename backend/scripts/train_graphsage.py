"""
Offline training script for GraphSAGE on the Elliptic dataset.

Strategy:
- Temporal split: train on time steps 1-34, test on 35-49
- Validation: time steps 30-34 (temporal holdout within training range)
- Excludes 'unknown' class nodes from loss computation
- Class-weighted CrossEntropyLoss (illicit:licit ratio ~9:1)
- Adam optimizer, lr=0.001
- 200 epochs with early stopping on val PR-AUC
- Full-graph training with NeighborSampler for memory efficiency

Usage:
    python scripts/train_graphsage.py

Outputs:
    weights/graphsage_best.pt
    precomputed/bitcoin_metrics.json  (updated with graphsage section)
"""

import sys
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import json
import torch
import torch.nn.functional as F
from torch_geometric.data import Data
from torch_geometric.loader import NeighborLoader
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, average_precision_score,
)
import pandas as pd
import numpy as np

from config import settings
from models.bitcoin.graphsage import GraphSAGEModel
from services.bitcoin.data_loader import load_elliptic_data


def build_pyg_data(elliptic: dict) -> tuple[Data, dict]:
    features_df = elliptic["features"]
    edgelist_df = elliptic["edgelist"]

    feature_cols = [
        c for c in features_df.columns
        if c.startswith(("local_feat_", "agg_feat_"))
    ]

    x = torch.tensor(features_df[feature_cols].values, dtype=torch.float)

    # Map string txIds to integer indices
    tx_list = features_df["txId"].tolist()
    tx_to_idx = {tx: i for i, tx in enumerate(tx_list)}

    src = [tx_to_idx[t] for t in edgelist_df["txId1"] if t in tx_to_idx]
    dst = [tx_to_idx[t] for t in edgelist_df["txId2"] if t in tx_to_idx]
    edge_index = torch.tensor([src, dst], dtype=torch.long)

    # Labels: 1=illicit, 0=licit, -1=unknown
    label_map = {"illicit": 1, "licit": 0, "unknown": -1}
    y_raw = features_df["class"].map(label_map).fillna(-1).astype(int).values
    y = torch.tensor(y_raw, dtype=torch.long)

    time_steps = features_df["time_step"].values

    train_mask = torch.tensor(
        (time_steps <= 29) & (y_raw != -1), dtype=torch.bool
    )
    val_mask = torch.tensor(
        ((time_steps >= 30) & (time_steps <= 34)) & (y_raw != -1), dtype=torch.bool
    )
    test_mask = torch.tensor(
        (time_steps >= 35) & (y_raw != -1), dtype=torch.bool
    )

    data = Data(x=x, edge_index=edge_index, y=y)
    data.train_mask = train_mask
    data.val_mask = val_mask
    data.test_mask = test_mask

    return data, tx_to_idx


def main():
    print("Loading Elliptic data...")
    elliptic = load_elliptic_data(settings.ELLIPTIC_DATA_DIR)

    print("Building PyG Data object...")
    data, _ = build_pyg_data(elliptic)

    # Class weights for imbalance
    train_labels = data.y[data.train_mask]
    n_licit = (train_labels == 0).sum().item()
    n_illicit = (train_labels == 1).sum().item()
    weight = torch.tensor([1.0, n_licit / max(n_illicit, 1)], dtype=torch.float)

    model = GraphSAGEModel(in_channels=165, hidden_channels=64, out_channels=2)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = torch.nn.CrossEntropyLoss(weight=weight)

    best_val_pr_auc = 0.0
    patience = 20
    patience_counter = 0

    print(f"Training: {n_illicit} illicit / {n_licit} licit nodes in train set")
    print(f"Class weight for illicit: {weight[1]:.2f}")

    for epoch in range(1, 201):
        model.train()
        optimizer.zero_grad()
        logits = model(data.x, data.edge_index)
        loss = criterion(logits[data.train_mask], data.y[data.train_mask])
        loss.backward()
        optimizer.step()

        if epoch % 10 == 0:
            model.eval()
            with torch.no_grad():
                val_logits = logits[data.val_mask]
                val_probs = F.softmax(val_logits, dim=1)[:, 1].numpy()
                val_labels = data.y[data.val_mask].numpy()

            pr_auc = average_precision_score(val_labels, val_probs)
            print(f"Epoch {epoch:3d} | Loss: {loss.item():.4f} | Val PR-AUC: {pr_auc:.4f}")

            if pr_auc > best_val_pr_auc:
                best_val_pr_auc = pr_auc
                torch.save(model.state_dict(), settings.WEIGHTS_DIR / "graphsage_best.pt")
                patience_counter = 0
                print(f"  Saved new best checkpoint (PR-AUC {pr_auc:.4f})")
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"Early stopping at epoch {epoch}")
                    break

    # Evaluate on test set
    model.load_state_dict(torch.load(settings.WEIGHTS_DIR / "graphsage_best.pt"))
    model.eval()
    with torch.no_grad():
        test_logits = model(data.x, data.edge_index)[data.test_mask]
        test_probs = F.softmax(test_logits, dim=1)[:, 1].numpy()
        test_preds = (test_probs >= 0.5).astype(int)
        test_labels = data.y[data.test_mask].numpy()

    metrics = {
        "graphsage": {
            "accuracy": round(accuracy_score(test_labels, test_preds), 4),
            "precision": round(precision_score(test_labels, test_preds, zero_division=0), 4),
            "recall": round(recall_score(test_labels, test_preds, zero_division=0), 4),
            "f1": round(f1_score(test_labels, test_preds, zero_division=0), 4),
            "roc_auc": round(roc_auc_score(test_labels, test_probs), 4),
            "pr_auc": round(average_precision_score(test_labels, test_probs), 4),
        }
    }

    # Merge with existing metrics (preserve gat if present)
    metrics_path = settings.PRECOMPUTED_DIR / "bitcoin_metrics.json"
    if metrics_path.exists():
        with open(metrics_path) as f:
            existing = json.load(f)
        existing.update(metrics)
        metrics = existing

    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print("\nTest metrics:")
    print(json.dumps(metrics["graphsage"], indent=2))
    print(f"\nSaved to {metrics_path}")


if __name__ == "__main__":
    main()
