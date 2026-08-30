from fastapi import APIRouter, Request, HTTPException, Query
import json

from services.bitcoin.graph_builder import extract_subgraph
from config import settings

router = APIRouter()


def _load_precomputed(filename: str):
    path = settings.PRECOMPUTED_DIR / filename
    with open(path) as f:
        return json.load(f)


@router.get("/stats")
def get_stats():
    raw = _load_precomputed("bitcoin_stats.json")
    # Return spec-compliant field names (the precomputed file uses different keys)
    return {
        "total_transactions": raw.get("total_nodes", raw.get("total_transactions", 0)),
        "total_edges": raw.get("total_edges", 0),
        "illicit_count": raw.get("illicit_count", 0),
        "licit_count": raw.get("licit_count", 0),
        "unknown_count": raw.get("unknown_count", 0),
        "labelled_count": raw.get("labelled_count", 0),
        "illicit_rate_labeled": raw.get("illicit_rate_labeled", raw.get("illicit_ratio", 0)),
        "illicit_ratio": raw.get("illicit_ratio", raw.get("illicit_rate_labeled", 0)),
        "time_steps": raw.get("time_steps", 49),
        "time_step_min": raw.get("time_step_min", 1),
        "time_step_max": raw.get("time_step_max", 49),
        "avg_degree": raw.get("avg_degree"),
    }


@router.get("/timeseries")
def get_timeseries():
    return _load_precomputed("bitcoin_timeseries.json")


@router.get("/metrics")
def get_metrics():
    raw = _load_precomputed("bitcoin_metrics.json")

    def normalize_model_metrics(m: dict) -> dict:
        """Add spec-compliant aliases for model-level metrics."""
        return {
            "pr_auc": m.get("pr_auc", 0),
            "roc_auc": m.get("roc_auc", 0),
            # f1_illicit / precision_illicit / recall_illicit may be stored as f1/precision/recall
            "f1_illicit": m.get("f1_illicit", m.get("f1", 0)),
            "precision_illicit": m.get("precision_illicit", m.get("precision", 0)),
            "recall_illicit": m.get("recall_illicit", m.get("recall", 0)),
            "accuracy": m.get("accuracy", 0),
            "confusion_matrix": m.get("confusion_matrix"),  # None if not precomputed
        }

    return {
        # Standard Elliptic train/test split: steps 1-34 train, 35-49 test
        "train_time_steps": raw.get("train_time_steps", [1, 34]),
        "test_time_steps": raw.get("test_time_steps", [35, 49]),
        "graphsage": normalize_model_metrics(raw.get("graphsage", {})),
        "gat": normalize_model_metrics(raw.get("gat", {})),
    }


@router.get("/transaction/{tx_id}")
def get_transaction(
    tx_id: str,
    request: Request,
    model: str = Query(default="graphsage", pattern="^(graphsage|gat)$"),
):
    elliptic = request.app.state.elliptic
    tx_index = elliptic["tx_index"]

    if tx_id not in tx_index:
        raise HTTPException(status_code=404, detail=f"Transaction {tx_id} not found")

    predictions = _load_precomputed("bitcoin_predictions.json")
    feature_importance = _load_precomputed("bitcoin_feature_importance.json")

    features_df = elliptic["features"]
    row = features_df.loc[tx_index[tx_id]]

    pred = predictions.get(tx_id, {})
    risk_score = pred.get(f"{model}_risk_score") if pred else None
    if risk_score is None:
        risk_score = pred.get("risk_score") if pred else None
    predicted_class = "illicit" if (risk_score is not None and risk_score >= 0.5) else ("licit" if risk_score is not None else "unknown")

    top_features = feature_importance.get(tx_id, [])[:10]

    adjacency = elliptic["adjacency"]
    neighbors = adjacency.get(tx_id, [])

    # Ground-truth class for each neighbor
    neighbor_true_classes = [
        str(features_df.loc[tx_index[n], "class"]) if n in tx_index else "unknown"
        for n in neighbors
    ]
    # Model-predicted risk for each neighbor
    neighbor_risks = [
        predictions.get(n, {}).get("risk_score", None)
        for n in neighbors
        if predictions.get(n, {}).get("risk_score") is not None
    ]

    # Normalize true_class to human-readable string
    tc_raw = str(row["class"])
    if tc_raw == "1":
        true_class_label = "illicit"
    elif tc_raw == "2":
        true_class_label = "licit"
    else:
        true_class_label = "unknown"

    return {
        "tx_id": tx_id,
        "time_step": int(row["time_step"]),
        "true_class": true_class_label,
        "predicted_class": predicted_class,
        "risk_score": round(float(risk_score), 4),
        "model": model,
        "top_features": top_features,
        "neighbor_summary": {
            "total": len(neighbors),
            "illicit_true": neighbor_true_classes.count("1"),
            "licit_true": neighbor_true_classes.count("2"),
            "unknown": neighbor_true_classes.count("unknown"),
            "illicit": neighbor_true_classes.count("1"),  # kept for frontend compat
            "depth1_avg_risk": round(sum(neighbor_risks) / len(neighbor_risks), 4)
                               if neighbor_risks else 0.0,
        },
    }


@router.get("/graph/{tx_id}")
def get_graph(
    tx_id: str,
    request: Request,
    depth: int = Query(default=1, ge=1, le=3),
    direction: str = Query(default="both", pattern="^(incoming|outgoing|both)$"),
    model: str = Query(default="graphsage", pattern="^(graphsage|gat)$"),
):
    elliptic = request.app.state.elliptic
    if tx_id not in elliptic["tx_index"]:
        raise HTTPException(status_code=404, detail=f"Transaction {tx_id} not found")

    predictions = _load_precomputed("bitcoin_predictions.json")
    subgraph = extract_subgraph(
        center_tx_id=tx_id,
        elliptic_data=elliptic,
        predictions=predictions,
        depth=depth,
        direction=direction,
    )
    if subgraph is None:
        raise HTTPException(status_code=404, detail="Could not build subgraph")
    return subgraph


@router.get("/clusters")
def get_clusters(
    min_risk: float = Query(default=0.0, ge=0.0, le=1.0),
    min_size: int = Query(default=0, ge=0),
    time_step_min: int = Query(default=1, ge=1),
    time_step_max: int = Query(default=49, le=9999),
):
    clusters = _load_precomputed("bitcoin_clusters.json")
    filtered = [
        c for c in clusters
        if (min_risk == 0 or c["avg_risk_score"] >= min_risk)
        and (min_size == 0 or c["node_count"] >= min_size)
        and c["time_step_max"] >= time_step_min
        and c["time_step_min"] <= time_step_max
    ]
    return {"clusters": filtered, "total": len(filtered)}


@router.get("/cluster/{cluster_id}")
def get_cluster_detail(cluster_id: str, request: Request):
    clusters = _load_precomputed("bitcoin_clusters.json")
    cluster = next((c for c in clusters if c["cluster_id"] == cluster_id), None)
    if cluster is None:
        raise HTTPException(status_code=404, detail=f"Cluster {cluster_id} not found")

    elliptic = request.app.state.elliptic
    predictions = _load_precomputed("bitcoin_predictions.json")
    features_df = elliptic["features"]
    tx_index = elliptic["tx_index"]
    edgelist = elliptic["edgelist"]

    # Use ALL cluster nodes (capped) instead of BFS from one center
    cluster_node_ids = cluster["node_ids"]
    max_nodes = settings.MAX_SUBGRAPH_NODES
    node_ids_to_render = cluster_node_ids[:max_nodes]
    node_set = set(node_ids_to_render)

    # Normalize volume for node sizing
    volumes = [
        float(features_df.loc[tx_index[tx], "local_feat_0"])
        for tx in node_ids_to_render
        if tx in tx_index
    ]
    vol_min = min(volumes, default=0)
    vol_max = max(volumes, default=1)
    vol_range = vol_max - vol_min or 1

    nodes = []
    for tx in node_ids_to_render:
        if tx not in tx_index:
            continue
        row = features_df.loc[tx_index[tx]]
        pred = predictions.get(tx, {})
        risk = pred.get("risk_score", None)
        vol = float(row["local_feat_0"])
        nodes.append({
            "id": tx,
            "true_class": str(row["class"]),
            "predicted_class": pred.get("predicted_class", "unknown"),
            "risk_score": risk,
            "time_step": int(row["time_step"]),
            "volume_normalized": round((vol - vol_min) / vol_range, 4),
            "is_center": False,
        })

    # Edges between cluster nodes only
    edges_df = edgelist[
        edgelist["txId1"].isin(node_set) & edgelist["txId2"].isin(node_set)
    ]
    edges = [
        {"source": row["txId1"], "target": row["txId2"], "amount_normalized": 1.0}
        for _, row in edges_df.iterrows()
    ]

    # Sink node analysis for why-flagged
    out_nodes = set(edges_df["txId1"].tolist())
    in_only_nodes = node_set - out_nodes
    common_dest_count = len(in_only_nodes)

    return {
        "cluster_id": cluster_id,
        "nodes": nodes,
        "edges": edges,
        "truncated": len(cluster_node_ids) > max_nodes,
        "stats": {
            "illicit_ratio": cluster["illicit_ratio"],
            "avg_risk_score": cluster["avg_risk_score"],
            "common_destinations_count": min(common_dest_count, 10),
            "time_span_steps": cluster["time_step_max"] - cluster["time_step_min"] + 1,
            "known_illicit_count": cluster["illicit_count"],
        },
    }
