from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import bitcoin, kyc
from services.bitcoin.data_loader import load_elliptic_data
from services.bitcoin.inference import load_bitcoin_models
from services.kyc.inference import load_kyc_models
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading Elliptic dataset...")
    app.state.elliptic = load_elliptic_data(settings.ELLIPTIC_DATA_DIR)
    print(f"  Loaded {len(app.state.elliptic['tx_index'])} transactions.")

    print("Loading Bitcoin GNN models...")
    app.state.bitcoin_models = load_bitcoin_models(settings.WEIGHTS_DIR)
    print(f"  Loaded: {list(app.state.bitcoin_models.keys())}")

    print("Loading KYC models...")
    app.state.kyc_models = load_kyc_models(settings.WEIGHTS_DIR)
    if app.state.kyc_models:
        print(f"  Loaded: {list(app.state.kyc_models.keys())}")
    else:
        print("  No KYC weights found. KYC endpoints will return placeholder responses.")

    print("All models and data loaded. Server is ready.")
    yield
    # Shutdown: nothing to clean up for prototype


app = FastAPI(
    title="RISKNET API",
    version="1.0.0",
    description="Bitcoin fraud detection and deepfake KYC platform.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(bitcoin.router, prefix="/api/bitcoin", tags=["bitcoin"])
app.include_router(kyc.router, prefix="/api/kyc", tags=["kyc"])


@app.get("/health")
def health():
    return {"status": "ok"}
