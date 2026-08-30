# 3. System Architecture and Prototype

AegisGraph is designed for real-world feasibility in live payment environments. The architecture bridges complex graph mathematics with a low-latency API and an analyst-centric dashboard.

## Tech Stack
- **Backend and ML API** Python, FastAPI, PyTorch Geometric, NetworkX
- **Frontend Dashboard** React 19, Vite, TailwindCSS (or Vanilla CSS styling)
- **Data Visualization** Cytoscape.js (for network graphs), Recharts, TanStack Table

## Real-Time Inference Flow
To meet strict payment processing SLAs (sub-50ms), we cannot run Graph Neural Networks across the entire 203,000-node network for every single transaction. We solved this scalability issue using localized BFS extraction

1. **Trigger** An Analyst or Payment Gateway sends a transaction ID to the API.
2. **Subgraph Sampling** The Backend runs a highly optimized Breadth-First Search (BFS) to extract just the immediate 1 to 3 hop neighborhood (capped at 300 nodes to prevent memory spikes).
3. **Inference** The GNN evaluates this compact local neighborhood and produces a risk score (0.0 = licit, 1.0 = illicit) in under 50ms.
4. **Explainability** The API calculates gradient-based feature attribution to mathematically explain why the transaction was flagged.
5. **Visualization** The Frontend renders the neighborhood interactively using Cytoscape.js, allowing the analyst to visually confirm the fraud pattern.

## Key Dashboard Screens

### 1. The Analyst Dashboard
A high-level command center showing overall statistics, a time-series of illicit activity across recent time steps, and risk score distributions.

### 2. Fraud Ring Explorer
Detects coordinated fraud rings using Weakly Connected Component decomposition. It flags any cluster of 3 or more nodes where the illicit ratio exceeds 20% or the average risk score exceeds 0.60. Analysts can drill down into any flagged ring to view its full topology.

### 3. Network Explorer
Turns opaque AI scores into visual, explorable maps. Loading thousands of nodes into a web browser causes UI freezing, so we paginated the graph data on the backend. Analysts start with a focused view and can click any node to dynamically fetch and expand its specific neighbors on demand.

### 4. Investigate Transaction (Explainable AI)
For every flagged transaction, the system outputs the top 10 most influential factors (e.g., transaction volume, aggregate neighbor statistics) and summarizes the risk of the surrounding 1-hop neighbors. This makes the AI decision fully transparent and auditable for banking compliance teams.
