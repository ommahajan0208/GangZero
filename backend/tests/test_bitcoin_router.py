"""
Basic smoke tests for bitcoin router endpoints.
Uses FastAPI TestClient with a mocked app state to avoid loading real data.
"""
import json
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from main import app

    # Inject mock state so tests don't need real data files
    mock_elliptic = {
        "tx_index": {"tx_001": 0, "tx_002": 1},
        "features": MagicMock(),
        "adjacency": {"tx_001": ["tx_002"]},
        "edgelist": MagicMock(),
    }
    app.state.elliptic = mock_elliptic
    app.state.bitcoin_models = {}
    app.state.kyc_models = {}

    with TestClient(app) as c:
        yield c


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_stats_endpoint(client):
    with patch("routers.bitcoin._load_precomputed") as mock_load:
        mock_load.return_value = {"total_nodes": 203769}
        resp = client.get("/api/bitcoin/stats")
        assert resp.status_code == 200
        assert "total_nodes" in resp.json()


def test_metrics_endpoint(client):
    with patch("routers.bitcoin._load_precomputed") as mock_load:
        mock_load.return_value = {"graphsage": {"accuracy": 0.94}}
        resp = client.get("/api/bitcoin/metrics")
        assert resp.status_code == 200


def test_transaction_not_found(client):
    with patch("routers.bitcoin._load_precomputed") as mock_load:
        mock_load.return_value = {}
        resp = client.get("/api/bitcoin/transaction/nonexistent_tx")
        assert resp.status_code == 404


def test_clusters_endpoint(client):
    sample_clusters = [
        {
            "cluster_id": "CLR-0001",
            "node_ids": ["tx_001"],
            "node_count": 5,
            "illicit_count": 2,
            "illicit_ratio": 0.4,
            "avg_risk_score": 0.8,
            "time_step_min": 1,
            "time_step_max": 10,
        }
    ]
    with patch("routers.bitcoin._load_precomputed") as mock_load:
        mock_load.return_value = sample_clusters
        resp = client.get("/api/bitcoin/clusters?min_risk=0.7&min_size=3")
        assert resp.status_code == 200
        data = resp.json()
        assert "clusters" in data
        assert "total" in data
