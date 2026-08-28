from fastapi import APIRouter, Request, UploadFile, File, HTTPException
import tempfile
import base64
import io
from pathlib import Path
from PIL import Image
import json

from services.kyc.face_detector import detect_and_crop_face
from services.kyc.frame_extractor import extract_frames
from services.kyc.inference import run_kyc_inference
from config import settings

router = APIRouter()

VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _make_thumbnail_b64(image: Image.Image, size: int = 160) -> str:
    thumb = image.resize((size, size))
    buf = io.BytesIO()
    thumb.save(buf, format="JPEG", quality=70)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def _verdict_from_score(score: float) -> str:
    if score >= 0.75:
        return "high_risk"
    if score >= 0.50:
        return "suspicious"
    return "verified"


def _action_from_verdict(verdict: str) -> str:
    return {
        "high_risk": "reject",
        "suspicious": "manual_review",
        "verified": "proceed",
    }[verdict]


@router.post("/analyze")
async def analyze_kyc(request: Request, file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > settings.KYC_MAX_FILE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    suffix = Path(file.filename).suffix.lower()
    is_video = suffix in VIDEO_EXTENSIONS
    is_image = suffix in IMAGE_EXTENSIONS

    if not (is_video or is_image):
        raise HTTPException(status_code=415, detail="Unsupported file type")

    kyc_models = request.app.state.kyc_models

    if is_image:
        image = Image.open(io.BytesIO(content)).convert("RGB")
        face = detect_and_crop_face(image)
        if face is None:
            raise HTTPException(status_code=422, detail="No face detected in image")

        model_results = run_kyc_inference(face, kyc_models)
        ensemble_score = model_results["ensemble"]["score"]
        verdict = _verdict_from_score(ensemble_score)

        return {
            "verdict": verdict,
            "deepfake_probability": ensemble_score,
            "recommended_action": _action_from_verdict(verdict),
            "models": model_results,
            "frames": [],
            "is_video": False,
            "face_detected": True,
        }

    # Video path
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        frames = extract_frames(tmp_path, n_frames=settings.KYC_MAX_VIDEO_FRAMES)
    finally:
        tmp_path.unlink(missing_ok=True)

    if not frames:
        raise HTTPException(status_code=422, detail="Could not extract frames from video")

    frame_results = []
    all_ensemble_scores = []
    last_model_results = None

    for frame_idx, timestamp, frame_img in frames:
        face = detect_and_crop_face(frame_img)
        if face is None:
            continue

        results = run_kyc_inference(face, kyc_models)
        score = results["ensemble"]["score"]
        all_ensemble_scores.append(score)
        last_model_results = results

        frame_results.append({
            "frame_index": frame_idx,
            "timestamp_sec": timestamp,
            "score": round(score, 4),
            "thumbnail_b64": _make_thumbnail_b64(face),
        })

    if not all_ensemble_scores:
        raise HTTPException(status_code=422, detail="No faces detected in any video frame")

    avg_score = sum(all_ensemble_scores) / len(all_ensemble_scores)
    verdict = _verdict_from_score(avg_score)

    return {
        "verdict": verdict,
        "deepfake_probability": round(avg_score, 4),
        "recommended_action": _action_from_verdict(verdict),
        "models": last_model_results,
        "frames": frame_results,
        "is_video": True,
        "face_detected": True,
    }


@router.get("/metrics")
def get_kyc_metrics():
    path = settings.PRECOMPUTED_DIR / "kyc_metrics.json"
    if not path.exists():
        return {"message": "KYC model metrics not yet available. Train KYC models first."}
    with open(path) as f:
        return json.load(f)


@router.get("/dataset-info")
def get_dataset_info():
    return {
        "datasets": [
            {
                "name": "FaceForensics++",
                "real_videos": 1000,
                "fake_videos": 4000,
                "manipulations": ["DeepFakes", "Face2Face", "FaceSwap", "NeuralTextures"],
                "license": "Academic (research use only)",
                "url": "https://github.com/ondyari/FaceForensics",
            },
            {
                "name": "Celeb-DF v2",
                "real_videos": 590,
                "fake_videos": 5639,
                "license": "Research use",
                "url": "https://github.com/yuezunli/celeb-deepfakeforensics",
            },
        ]
    }
