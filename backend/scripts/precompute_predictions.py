"""
Runs full-graph GraphSAGE and GAT inference on all Elliptic nodes.
Also computes gradient * input feature attribution for each labeled node.

Outputs:
    precomputed/bitcoin_predictions.json
    precomputed/bitcoin_feature_importance.json

Format of bitcoin_predictions.json:
{
  "txId_string": {
    "graphsage_risk_score": 0.873,
    "gat_risk_score": 0.912,
    "risk_score": 0.873,
    "predicted_class": "illicit",
    "true_class": "licit"
  },
  ...
}

Format of bitcoin_feature_importance.json:
{
  "txId_string": [
    {"name": "local_feat_6", "importance": 52.9, "value": 12.4},
    ...
  ],
  ...
}

Usage:
    python scripts/precompute_predictions.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import json
import torch
import torch.nn.functional as F
import numpy as np

from config import settings
from models.bitcoin.graphsage import GraphSAGEModel
from models.bitcoin.gat import GATModel
from services.bitcoin.data_loader import load_elliptic_data
from scripts.train_graphsage import build_pyg_data


def compute_gradient_attribution(model, data, node_indices):
    """Gradient * input attribution for all given node indices."""
    x = data.x.clone().requires_grad_(True)
    logits = model(x, data.edge_index)
    # Backprop through illicit class logit for each target node
    illicit_logits = logits[node_indices, 1].sum()
    illicit_logits.backward()
    grad = x.grad[node_indices].detach().numpy()          # [N_labeled, 166]
    inp = data.x[node_indices].detach().numpy()           # [N_labeled, 166]
    return grad * inp                                      # element-wise product


def main():
    print("Loading data...")
    elliptic = load_elliptic_data(settings.ELLIPTIC_DATA_DIR)
    data, tx_to_idx = build_pyg_data(elliptic)
    idx_to_tx = {v: k for k, v in tx_to_idx.items()}
    features_df = elliptic["features"]

    feature_cols = [
        c for c in features_df.columns
        if c.startswith(("local_feat_", "agg_feat_"))
    ]

    print("Loading models...")
    graphsage = GraphSAGEModel(in_channels=165, hidden_channels=64, out_channels=2)
    graphsage.load_state_dict(torch.load(settings.WEIGHTS_DIR / "graphsage_best.pt"))
    graphsage.eval()

    gat = GATModel(in_channels=165, hidden_channels=64, out_channels=2, heads=4)
    gat.load_state_dict(torch.load(settings.WEIGHTS_DIR / "gat_best.pt"))
    gat.eval()

    print("Running full-graph inference...")
    with torch.no_grad():
        gs_logits = graphsage(data.x, data.edge_index)
        gs_probs = F.softmax(gs_logits, dim=1)[:, 1].numpy()

        gat_logits = gat(data.x, data.edge_index)
        gat_probs = F.softmax(gat_logits, dim=1)[:, 1].numpy()

    predictions = {}
    n = len(data.x)
    for i in range(n):
        tx_id = idx_to_tx.get(i)
        if tx_id is None:
            continue
        gs_score = round(float(gs_probs[i]), 4)
        gat_score = round(float(gat_probs[i]), 4)
        pred_class = "illicit" if gs_score >= 0.5 else "licit"
        true_class = str(features_df.loc[i, "class"]) if i < len(features_df) else "unknown"
        predictions[tx_id] = {
            "graphsage_risk_score": gs_score,
            "gat_risk_score": gat_score,
            "risk_score": gs_score,
            "predicted_class": pred_class,
            "true_class": true_class,
        }

    print(f"Computed {len(predictions)} predictions.")

    # Feature attribution — only for labeled nodes (can be slow for all 46k)
    labeled_indices = torch.where(data.y != -1)[0]
    print(f"Computing gradient attribution for {len(labeled_indices)} labeled nodes...")

    graphsage_for_grad = GraphSAGEModel(in_channels=165, hidden_channels=64, out_channels=2)
    graphsage_for_grad.load_state_dict(torch.load(settings.WEIGHTS_DIR / "graphsage_best.pt"))
    graphsage_for_grad.train()  # Need grad

    batch_size = 500
    feature_importance = {}

    for start in range(0, len(labeled_indices), batch_size):
        batch_idx = labeled_indices[start : start + batch_size]
        attributions = compute_gradient_attribution(graphsage_for_grad, data, batch_idx)

        for j, node_idx in enumerate(batch_idx.tolist()):
            tx_id = idx_to_tx.get(node_idx)
            if tx_id is None:
                continue
            attr = attributions[j]
            inp = data.x[node_idx].numpy()
            entries = [
                {
                    "name": feature_cols[k],
                    "importance": round(float(abs(attr[k])), 6),
                    "value": round(float(inp[k]), 6),
                }
                for k in range(len(feature_cols))
            ]
            entries.sort(key=lambda e: e["importance"], reverse=True)
            feature_importance[tx_id] = entries[:10]

        if start % 5000 < batch_size:
            print(f"  Processed {start + len(batch_idx)}/{len(labeled_indices)} nodes...")

    print("Saving predictions and feature importance...")
    pred_path = settings.PRECOMPUTED_DIR / "bitcoin_predictions.json"
    fi_path = settings.PRECOMPUTED_DIR / "bitcoin_feature_importance.json"

    with open(pred_path, "w") as f:
        json.dump(predictions, f)
    with open(fi_path, "w") as f:
        json.dump(feature_importance, f)

    print(f"Done. Saved to {pred_path} and {fi_path}")


if __name__ == "__main__":
    main()
