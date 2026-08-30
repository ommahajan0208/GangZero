"""
Extracts a subgraph around a center txId using BFS up to a given depth.
Returns nodes + edges in the JSON-serializable format the router sends to the frontend.
"""
from config import settings


def extract_subgraph(
    center_tx_id: str,
    elliptic_data: dict,
    predictions: dict,
    depth: int = 1,
    direction: str = "both",
    max_nodes: int = settings.MAX_SUBGRAPH_NODES,
) -> dict | None:
    features = elliptic_data["features"]
    tx_index = elliptic_data["tx_index"]
    adjacency = elliptic_data["adjacency"]
    edgelist = elliptic_data["edgelist"]

    if center_tx_id not in tx_index:
        return None

    # BFS
    visited = {center_tx_id}
    frontier = {center_tx_id}
    for _ in range(depth):
        next_frontier = set()
        for tx in frontier:
            neighbors = adjacency.get(tx, [])
            for n in neighbors:
                if n not in visited:
                    next_frontier.add(n)
                    visited.add(n)
        frontier = next_frontier
        if len(visited) >= max_nodes:
            break

    visited_list = list(visited)[:max_nodes]

    # Normalize volume for node sizing
    volumes = [
        float(features.loc[tx_index[tx], "local_feat_0"])
        for tx in visited_list
        if tx in tx_index
    ]
    vol_min = min(volumes, default=0)
    vol_max = max(volumes, default=1)
    vol_range = vol_max - vol_min or 1

    nodes = []
    for tx in visited_list:
        if tx not in tx_index:
            continue
        row = features.loc[tx_index[tx]]
        pred = predictions.get(tx, {})
        risk = pred.get("risk_score", None)
        vol = float(row["local_feat_0"])
        nodes.append({
            "id": tx,
            "true_class": row["class"],
            "predicted_class": pred.get("predicted_class", "unknown"),
            "risk_score": risk,
            "time_step": int(row["time_step"]),
            "volume_normalized": round((vol - vol_min) / vol_range, 4),
            "is_center": tx == center_tx_id,
        })

    # Edges: only between nodes in our visited set
    visited_set = set(visited_list)
    edges_df = edgelist[
        edgelist["txId1"].isin(visited_set) & edgelist["txId2"].isin(visited_set)
    ]

    edges = [
        {"source": row["txId1"], "target": row["txId2"], "amount_normalized": 1.0}
        for _, row in edges_df.iterrows()
    ]

    return {
        "center_tx_id": center_tx_id,
        "depth": depth,
        "nodes": nodes,
        "edges": edges,
        "truncated": len(visited_list) == max_nodes,
        "node_count": len(nodes),
    }
