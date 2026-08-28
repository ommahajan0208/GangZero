from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).parent

class Settings(BaseSettings):
    ELLIPTIC_DATA_DIR: Path = BASE_DIR.parent / "data" / "elliptic_bitcoin_dataset"
    WEIGHTS_DIR: Path = BASE_DIR / "weights"
    PRECOMPUTED_DIR: Path = BASE_DIR / "precomputed"

    # Bitcoin inference
    GRAPHSAGE_WEIGHTS: str = "graphsage_best.pt"
    GAT_WEIGHTS: str = "gat_best.pt"

    # KYC inference
    EFFICIENTNET_WEIGHTS: str = "efficientnet_best.pt"
    VIT_WEIGHTS: str = "vit_best.pt"
    FREQUENCY_CNN_WEIGHTS: str = "frequency_cnn_best.pt"

    # Graph serving
    MAX_SUBGRAPH_NODES: int = 300
    DEFAULT_GRAPH_DEPTH: int = 1

    # KYC processing
    KYC_MAX_VIDEO_FRAMES: int = 5
    KYC_FRAME_SIZE: int = 224
    KYC_MAX_FILE_MB: int = 30
    KYC_THUMBNAIL_SIZE: int = 160

    # Cluster detection
    MIN_CLUSTER_SIZE: int = 3
    CLUSTER_ILLICIT_RATIO_THRESHOLD: float = 0.2
    CLUSTER_AVG_RISK_THRESHOLD: float = 0.60

    class Config:
        env_file = ".env"

settings = Settings()
