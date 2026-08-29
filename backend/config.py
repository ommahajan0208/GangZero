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

    # Graph serving
    MAX_SUBGRAPH_NODES: int = 300
    DEFAULT_GRAPH_DEPTH: int = 1

    # Cluster detection
    MIN_CLUSTER_SIZE: int = 3
    CLUSTER_ILLICIT_RATIO_THRESHOLD: float = 0.2
    CLUSTER_AVG_RISK_THRESHOLD: float = 0.60

    class Config:
        env_file = ".env"

settings = Settings()
