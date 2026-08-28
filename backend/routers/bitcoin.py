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
    return _load_precomputed("bitcoin_stats.json")


@router.get("/timeseries")
def get_timeseries():
    return _load_precomputed("bitcoin_timeseries.json")


@router.get("/metrics")
def get_metrics():
    return _load_precomputed("bitcoin_metrics.json")


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
    risk_score = pred.get(f"{model}_risk_score") or pred.get("risk_score", 0.0)
    predicted_class = "illicit" if risk_score >= 0.5 else "licit"

    top_features = feature_importance.get(tx_id, [])[:10]

    adjacency = elliptic["adjacency"]
    neighbors = adjacency.get(tx_id, [])
    neighbor_classes = [
        predictions.get(n, {}).get("predicted_class", "unknown")
        for n in neighbors
    ]
    neighbor_risks = [
        predictions.get(n, {}).get("risk_score", 0.0)
        for n in neighbors
        if predictions.get(n, {}).get("risk_score") is not None
    ]

    return {
        "tx_id": tx_id,
        "time_step": int(row["time_step"]),
        "true_class": str(row["class"]),
        "predicted_class": predicted_class,
        "risk_score": round(float(risk_score), 4),
        "model": model,
        "top_features": top_features,
        "neighbor_summary": {
            "total": len(neighbors),
            "illicit": neighbor_classes.count("illicit"),
            "licit": neighbor_classes.count("licit"),
            "unknown": neighbor_classes.count("unknown"),
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
    min_risk: float = Query(default=0.7, ge=0.0, le=1.0),
    min_size: int = Query(default=5, ge=1),
    time_step_min: int = Query(default=1, ge=1),
    time_step_max: int = Query(default=49, le=49),
):
    clusters = _load_precomputed("bitcoin_clusters.json")
    filtered = [
        c for c in clusters
        if c["avg_risk_score"] >= min_risk
        and c["node_count"] >= min_size
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

    subgraph = extract_subgraph(
        center_tx_id=cluster["node_ids"][0],
        elliptic_data=elliptic,
        predictions=predictions,
        depth=3,
    )

    # Find sink nodes (potential cash-out candidates) within the cluster
    cluster_node_set = set(cluster["node_ids"])
    edgelist = elliptic["edgelist"]
    within = edgelist[
        edgelist["txId1"].isin(cluster_node_set) & edgelist["txId2"].isin(cluster_node_set)
    ]
    out_nodes = set(within["txId1"].tolist())
    in_only_nodes = cluster_node_set - out_nodes
    common_dest_count = len(in_only_nodes)

    return {
        "cluster_id": cluster_id,
        "nodes": subgraph["nodes"] if subgraph else [],
        "edges": subgraph["edges"] if subgraph else [],
        "stats": {
            "illicit_ratio": cluster["illicit_ratio"],
            "avg_risk_score": cluster["avg_risk_score"],
            "common_destinations_count": min(common_dest_count, 10),
            "time_span_steps": cluster["time_step_max"] - cluster["time_step_min"] + 1,
            "known_illicit_count": cluster["illicit_count"],
        },
    }
