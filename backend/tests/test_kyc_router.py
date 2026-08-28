"""
Basic smoke tests for the KYC router endpoints.
"""
import io
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from PIL import Image


@pytest.fixture
def client():
    from main import app

    app.state.elliptic = {
        "tx_index": {},
        "features": MagicMock(),
        "adjacency": {},
        "edgelist": MagicMock(),
    }
    app.state.bitcoin_models = {}
    app.state.kyc_models = {}

    with TestClient(app) as c:
        yield c


def _make_fake_image_bytes() -> bytes:
    img = Image.new("RGB", (224, 224), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_kyc_metrics_no_file(client):
    resp = client.get("/api/kyc/metrics")
    # Returns either metrics dict or a message — both are valid
    assert resp.status_code == 200


def test_kyc_dataset_info(client):
    resp = client.get("/api/kyc/dataset-info")
    assert resp.status_code == 200
    data = resp.json()
    assert "datasets" in data
    assert len(data["datasets"]) == 2


def test_kyc_analyze_unsupported_type(client):
    resp = client.post(
        "/api/kyc/analyze",
        files={"file": ("test.txt", b"hello", "text/plain")},
    )
    assert resp.status_code == 415


def test_kyc_analyze_image_no_face(client):
    img_bytes = _make_fake_image_bytes()
    with patch("routers.kyc.detect_and_crop_face", return_value=None):
        resp = client.post(
            "/api/kyc/analyze",
            files={"file": ("test.jpg", img_bytes, "image/jpeg")},
        )
    assert resp.status_code == 422


def test_kyc_analyze_image_with_face(client):
    img_bytes = _make_fake_image_bytes()
    fake_face = Image.new("RGB", (224, 224))
    fake_results = {
        "efficientnet": {"score": 0.3, "tier": "low"},
        "ensemble": {"score": 0.3, "tier": "low"},
    }
    with (
        patch("routers.kyc.detect_and_crop_face", return_value=fake_face),
        patch("routers.kyc.run_kyc_inference", return_value=fake_results),
    ):
        resp = client.post(
            "/api/kyc/analyze",
            files={"file": ("test.jpg", img_bytes, "image/jpeg")},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "verdict" in data
    assert "deepfake_probability" in data
