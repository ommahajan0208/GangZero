from pydantic import BaseModel
from typing import Optional


class FeatureItem(BaseModel):
    name: str
    importance: float
    value: float


class NeighborSummary(BaseModel):
    total: int
    illicit: int
    licit: int
    unknown: int
    depth1_avg_risk: float


class TransactionResponse(BaseModel):
    tx_id: str
    time_step: int
    true_class: str
    predicted_class: str
    risk_score: float
    model: str
    top_features: list[FeatureItem]
    neighbor_summary: NeighborSummary


class GraphNode(BaseModel):
    id: str
    true_class: str
    predicted_class: str
    risk_score: Optional[float] = None
    time_step: int
    volume_normalized: float
    is_center: bool


class GraphEdge(BaseModel):
    source: str
    target: str
    amount_normalized: float


class GraphResponse(BaseModel):
    center_tx_id: str
    depth: int
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    truncated: bool
    node_count: int


class ClusterStats(BaseModel):
    illicit_ratio: float
    avg_risk_score: float
    common_destinations_count: int
    time_span_steps: int
    known_illicit_count: int


class ClusterListItem(BaseModel):
    cluster_id: str
    node_count: int
    illicit_count: int
    illicit_ratio: float
    avg_risk_score: float
    time_step_min: int
    time_step_max: int


class ClusterListResponse(BaseModel):
    clusters: list[ClusterListItem]
    total: int
