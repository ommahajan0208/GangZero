"""
Unit tests for cluster detector logic.
"""
import pandas as pd
from services.bitcoin.cluster_detector import detect_clusters


def _make_elliptic_data(edges, classes):
    """Build a minimal elliptic_data dict for testing."""
    all_nodes = set()
    for src, dst in edges:
        all_nodes.add(src)
        all_nodes.add(dst)

    features_rows = [
        {"txId": n, "time_step": 1, "class": classes.get(n, "unknown")}
        for n in all_nodes
    ]
    features_df = pd.DataFrame(features_rows)

    edgelist_df = pd.DataFrame(edges, columns=["txId1", "txId2"])
    edgelist_df = edgelist_df.astype(str)
    features_df["txId"] = features_df["txId"].astype(str)

    return {"features": features_df, "edgelist": edgelist_df}


def test_no_clusters_when_below_thresholds():
    edges = [("a", "b"), ("b", "c")]
    classes = {"a": "licit", "b": "licit", "c": "licit"}
    data = _make_elliptic_data(edges, classes)
    predictions = {"a": {"risk_score": 0.1}, "b": {"risk_score": 0.05}, "c": {"risk_score": 0.08}}

    result = detect_clusters(data, predictions, min_cluster_size=3, avg_risk_threshold=0.6)
    assert result == []


def test_cluster_detected_by_illicit_ratio():
    edges = [("a", "b"), ("b", "c"), ("c", "d")]
    classes = {"a": "illicit", "b": "illicit", "c": "licit", "d": "licit"}
    data = _make_elliptic_data(edges, classes)
    predictions = {
        "a": {"risk_score": 0.3},
        "b": {"risk_score": 0.3},
        "c": {"risk_score": 0.1},
        "d": {"risk_score": 0.1},
    }

    result = detect_clusters(
        data, predictions,
        min_cluster_size=3,
        illicit_ratio_threshold=0.20,
        avg_risk_threshold=0.90,
    )
    assert len(result) == 1
    assert result[0]["illicit_count"] == 2


def test_cluster_sorted_by_avg_risk_desc():
    edges1 = [("a", "b"), ("b", "c")]
    edges2 = [("x", "y"), ("y", "z")]
    all_edges = edges1 + edges2 + [("c", "x")]  # Connect into one component for simplicity
    classes = {n: "illicit" for n in ["a", "b", "c", "x", "y", "z"]}
    data = _make_elliptic_data(all_edges, classes)
    predictions = {n: {"risk_score": 0.9} for n in ["a", "b", "c", "x", "y", "z"]}

    result = detect_clusters(data, predictions, min_cluster_size=3)
    assert result == sorted(result, key=lambda c: c["avg_risk_score"], reverse=True)
