import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import bitcoin
from services.bitcoin.data_loader import load_elliptic_data
from services.bitcoin.inference import load_bitcoin_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading Elliptic dataset...")
    app.state.elliptic = load_elliptic_data(settings.ELLIPTIC_DATA_DIR)
    print(f"  Loaded {len(app.state.elliptic['tx_index'])} transactions.")

    print("Loading Bitcoin GNN models...")
    app.state.bitcoin_models = load_bitcoin_models(settings.WEIGHTS_DIR)
    print(f"  Loaded: {list(app.state.bitcoin_models.keys())}")

    print("All models and data loaded. Server is ready.")
    yield
    # Shutdown: nothing to clean up for prototype


cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173",
    ).split(",")
    if origin.strip()
]

app = FastAPI(
    title="AegisGraph API",
    version="1.0.0",
    description="Bitcoin fraud detection platform.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.(onrender\.com|vercel\.app)$",
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(bitcoin.router, prefix="/api/bitcoin", tags=["bitcoin"])


@app.get("/health")
def health():
    return {"status": "ok"}