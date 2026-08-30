"""
Uses NetworkX connected components on the Elliptic edgelist.
Filters components by illicit ratio or average predicted risk.
Run offline via scripts/precompute_clusters.py — results stored in JSON.
"""
import networkx as nx


def detect_clusters(
    elliptic_data: dict,
    predictions: dict,
    min_cluster_size: int = 3,
    illicit_ratio_threshold: float = 0.20,
    avg_risk_threshold: float = 0.60,
) -> list[dict]:
    features = elliptic_data["features"]
    edgelist = elliptic_data["edgelist"]

    G = nx.from_pandas_edgelist(
        edgelist, source="txId1", target="txId2",
        create_using=nx.DiGraph()
    )

    clusters = []
    for i, component in enumerate(nx.weakly_connected_components(G)):
        if len(component) < min_cluster_size:
            continue

        node_list = list(component)
        classes = features[features["txId"].isin(node_list)]["class"].tolist()
        illicit_count = classes.count("illicit")
        illicit_ratio = illicit_count / len(node_list) if node_list else 0

        risk_scores = [
            predictions[tx]["risk_score"]
            for tx in node_list
            if tx in predictions and predictions[tx].get("risk_score") is not None
        ]
        avg_risk = sum(risk_scores) / len(risk_scores) if risk_scores else 0

        # Keep cluster if it meets either threshold
        if illicit_ratio < illicit_ratio_threshold and avg_risk < avg_risk_threshold:
            continue

        time_steps = features[features["txId"].isin(node_list)]["time_step"].tolist()

        clusters.append({
            "cluster_id": f"CLR-{i:04d}",
            "node_ids": node_list,
            "node_count": len(node_list),
            "illicit_count": illicit_count,
            "illicit_ratio": round(illicit_ratio, 4),
            "avg_risk_score": round(avg_risk, 4),
            "time_step_min": int(min(time_steps)) if time_steps else 0,
            "time_step_max": int(max(time_steps)) if time_steps else 0,
        })

    clusters.sort(key=lambda c: c["avg_risk_score"], reverse=True)
    return clusters
