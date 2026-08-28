"""
Unit tests for KYC inference utilities (DCT features, tier assignment).
"""
import numpy as np
import pytest
from PIL import Image
from services.kyc.frequency_analyzer import extract_dct_features, dct_thumbnail_b64


def _make_rgb_image(size: int = 224) -> Image.Image:
    arr = np.random.randint(0, 255, (size, size, 3), dtype=np.uint8)
    return Image.fromarray(arr)


def test_dct_feature_shape():
    img = _make_rgb_image(224)
    features = extract_dct_features(img, size=224)
    assert features.shape == (1, 224, 224)


def test_dct_feature_range():
    img = _make_rgb_image(224)
    features = extract_dct_features(img)
    assert features.min() >= 0.0
    assert features.max() <= 1.0 + 1e-6


def test_dct_thumbnail_b64_is_valid_data_url():
    img = _make_rgb_image(224)
    result = dct_thumbnail_b64(img, size=64)
    assert result.startswith("data:image/jpeg;base64,")
    assert len(result) > 100


def test_dct_different_images_differ():
    img1 = Image.new("RGB", (224, 224), color=(0, 0, 0))
    img2 = Image.new("RGB", (224, 224), color=(255, 255, 255))
    feat1 = extract_dct_features(img1)
    feat2 = extract_dct_features(img2)
    assert not np.allclose(feat1, feat2)
