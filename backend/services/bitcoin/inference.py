"""
Loads GraphSAGE and GAT models and runs inference on a single transaction node.
For the prototype, inference runs per-node using the pre-built subgraph.
Full-graph inference for bulk precomputation is done via precompute_predictions.py.
"""
import torch
import torch.nn.functional as F
from torch_geometric.data import Data
from pathlib import Path


def load_bitcoin_models(weights_dir: Path) -> dict:
    from models.bitcoin.graphsage import GraphSAGEModel
    from models.bitcoin.gat import GATModel

    device = torch.device("cpu")

    graphsage = GraphSAGEModel(in_channels=165, hidden_channels=64, out_channels=2)
    graphsage.load_state_dict(
        torch.load(weights_dir / "graphsage_best.pt", map_location=device)
    )
    graphsage.eval()

    gat = GATModel(in_channels=165, hidden_channels=64, out_channels=2, heads=4)
    gat.load_state_dict(
        torch.load(weights_dir / "gat_best.pt", map_location=device)
    )
    gat.eval()

    return {"graphsage": graphsage, "gat": gat}


def run_transaction_inference(
    tx_id: str,
    elliptic_data: dict,
    model: torch.nn.Module,
    subgraph_nodes: list,
    subgraph_edges: list,
) -> dict:
    """
    Constructs a PyG Data object from the subgraph and runs node classification
    on the center node.
    """
    features_df = elliptic_data["features"]
    tx_index = elliptic_data["tx_index"]

    node_ids = [n["id"] for n in subgraph_nodes]
    node_id_to_idx = {nid: i for i, nid in enumerate(node_ids)}
    center_idx = node_id_to_idx[tx_id]

    # Feature matrix [N, 166]
    feature_cols = [
        c for c in features_df.columns
        if c.startswith(("local_feat_", "agg_feat_"))
    ]
    x_rows = []
    for nid in node_ids:
        if nid in tx_index:
            row = features_df.loc[tx_index[nid], feature_cols].values.astype(float)
        else:
            row = [0.0] * 165
        x_rows.append(row)

    x = torch.tensor(x_rows, dtype=torch.float)

    # Edge index [2, E]
    edge_src = [
        node_id_to_idx[e["source"]]
        for e in subgraph_edges
        if e["source"] in node_id_to_idx and e["target"] in node_id_to_idx
    ]
    edge_dst = [
        node_id_to_idx[e["target"]]
        for e in subgraph_edges
        if e["source"] in node_id_to_idx and e["target"] in node_id_to_idx
    ]
    edge_index = torch.tensor([edge_src, edge_dst], dtype=torch.long)

    data = Data(x=x, edge_index=edge_index)

    with torch.no_grad():
        logits = model(data.x, data.edge_index)
        probs = F.softmax(logits, dim=1)
        center_prob = probs[center_idx]

    illicit_prob = float(center_prob[1])
    predicted_class = "illicit" if illicit_prob >= 0.5 else "licit"

    return {
        "risk_score": round(illicit_prob, 4),
        "predicted_class": predicted_class,
    }
