"""
Basic smoke tests for bitcoin router endpoints.
Uses FastAPI TestClient with a mocked app state to avoid loading real data.
"""
import json
import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


class TestBitcoinRouter(unittest.TestCase):
    def setUp(self):
        from main import app
        mock_elliptic = {
            "tx_index": {"tx_001": 0, "tx_002": 1},
            "features": MagicMock(),
            "adjacency": {"tx_001": ["tx_002"]},
            "edgelist": MagicMock(),
        }
        app.state.elliptic = mock_elliptic
        app.state.bitcoin_models = {}
        self.client = TestClient(app)

    def test_health(self):
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), {"status": "ok"})

    def test_stats_endpoint(self):
        with patch("routers.bitcoin._load_precomputed") as mock_load:
            mock_load.return_value = {"total_nodes": 203769}
            resp = self.client.get("/api/bitcoin/stats")
            self.assertEqual(resp.status_code, 200)
            self.assertIn("total_nodes", resp.json())

    def test_metrics_endpoint(self):
        with patch("routers.bitcoin._load_precomputed") as mock_load:
            mock_load.return_value = {"graphsage": {"accuracy": 0.94}}
            resp = self.client.get("/api/bitcoin/metrics")
            self.assertEqual(resp.status_code, 200)

    def test_transaction_not_found(self):
        with patch("routers.bitcoin._load_precomputed") as mock_load:
            mock_load.return_value = {}
            resp = self.client.get("/api/bitcoin/transaction/nonexistent_tx")
            self.assertEqual(resp.status_code, 404)

    def test_clusters_endpoint(self):
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
            resp = self.client.get("/api/bitcoin/clusters?min_risk=0.7&min_size=3")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertIn("clusters", data)
            self.assertIn("total", data)


if __name__ == "__main__":
    unittest.main()
