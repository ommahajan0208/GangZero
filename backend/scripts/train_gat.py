"""
Offline training script for GAT on the Elliptic dataset.

Same split strategy as train_graphsage.py. See that file for full notes.

Usage:
    python scripts/train_gat.py

Outputs:
    weights/gat_best.pt
    precomputed/bitcoin_metrics.json  (updated with gat section)
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import json
import torch
import torch.nn.functional as F
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, average_precision_score,
)

from config import settings
from models.bitcoin.gat import GATModel
from services.bitcoin.data_loader import load_elliptic_data
from scripts.train_graphsage import build_pyg_data   # Reuse the same builder


def main():
    print("Loading Elliptic data...")
    elliptic = load_elliptic_data(settings.ELLIPTIC_DATA_DIR)

    print("Building PyG Data object...")
    data, _ = build_pyg_data(elliptic)

    train_labels = data.y[data.train_mask]
    n_licit = (train_labels == 0).sum().item()
    n_illicit = (train_labels == 1).sum().item()
    weight = torch.tensor([1.0, n_licit / max(n_illicit, 1)], dtype=torch.float)

    model = GATModel(in_channels=166, hidden_channels=64, out_channels=2, heads=4)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = torch.nn.CrossEntropyLoss(weight=weight)

    best_val_pr_auc = 0.0
    patience = 20
    patience_counter = 0

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
                torch.save(model.state_dict(), settings.WEIGHTS_DIR / "gat_best.pt")
                patience_counter = 0
                print(f"  Saved new best checkpoint (PR-AUC {pr_auc:.4f})")
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"Early stopping at epoch {epoch}")
                    break

    # Evaluate on test set
    model.load_state_dict(torch.load(settings.WEIGHTS_DIR / "gat_best.pt"))
    model.eval()
    with torch.no_grad():
        test_logits = model(data.x, data.edge_index)[data.test_mask]
        test_probs = F.softmax(test_logits, dim=1)[:, 1].numpy()
        test_preds = (test_probs >= 0.5).astype(int)
        test_labels = data.y[data.test_mask].numpy()

    metrics = {
        "gat": {
            "accuracy": round(accuracy_score(test_labels, test_preds), 4),
            "precision": round(precision_score(test_labels, test_preds, zero_division=0), 4),
            "recall": round(recall_score(test_labels, test_preds, zero_division=0), 4),
            "f1": round(f1_score(test_labels, test_preds, zero_division=0), 4),
            "roc_auc": round(roc_auc_score(test_labels, test_probs), 4),
            "pr_auc": round(average_precision_score(test_labels, test_probs), 4),
        }
    }

    metrics_path = settings.PRECOMPUTED_DIR / "bitcoin_metrics.json"
    if metrics_path.exists():
        with open(metrics_path) as f:
            existing = json.load(f)
        existing.update(metrics)
        metrics = existing

    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print("\nTest metrics:")
    print(json.dumps(metrics["gat"], indent=2))
    print(f"\nSaved to {metrics_path}")


if __name__ == "__main__":
    main()
