# AegisGraph - Adaptive Graph Intelligence for Adversarial Payment Fraud

**Team GangZero | Mastercard Innovation Challenge 2026**

This project is an end-to-end Red Team / Blue Team system that uses **Graph Neural Networks (GNNs)** to identify, simulate, and defend against complex Generative AI fraud vectors on payment networks.

## Documentation

To help you understand our approach, architecture, and the models powering AegisGraph, we have broken down our technical documentation into clean, digestible guides

- **[Master Solution Walkthrough](docs/Solution_Walkthrough.md)** An executive brief covering the entire project from end to end
- **[1. GenAI Attack Vectors](docs/1_Attack_Vectors.md)** A deep dive into the novel AI-driven fraud patterns we identified (e.g., Mule Orchestration, Cross-Border Layering) and how they bypass traditional rules
- **[2. Graph Neural Networks](docs/2_Graph_Neural_Networks.md)** Why we chose GNNs over traditional tabular models like Random Forest, and how we solved massive class imbalances and temporal data leakage
- **[3. System Architecture and Prototype](docs/3_System_Architecture.md)** An overview of our low-latency inference flow, subgraph extraction API, and interactive React dashboard

## Project Structure
- `backend/` FastAPI application, BFS subgraph extraction, and PyTorch Geometric inference
- `frontend/` React 19 + Cytoscape.js interactive dashboard
- `notebooks/` Exploratory data analysis, baseline model comparisons (RF vs LR), and GNN training scripts
- `data/` Sample partitions of the Elliptic Bitcoin dataset
- `docs/` All documentation files linked above

## Quickstart

Follow these steps to set up the environment and run the prototype locally.

### 1. Clone the Repository
```bash
git clone https://github.com/ommahajan0208/GangZero.git
cd GangZero
```

### 2. Backend Setup (Python Environment)
Navigate to the backend directory, create a virtual environment, and install dependencies
```bash
cd backend
python -m venv venv
```
Activate the virtual environment
- On Windows `venv\Scripts\activate`
- On macOS and Linux `source venv/bin/activate`

Install the required packages
```bash
pip install -r requirements.txt
```

Start the FastAPI server
```bash
uvicorn main:app --reload
```

### 3. Frontend Setup (Node.js Environment)
Open a new terminal window, navigate to the frontend directory, and install dependencies
```bash
cd frontend
npm install
```

Start the development server
```bash
npm run dev
```

### 4. Environment Variables
If you need to configure custom API keys or database endpoints, copy the example environment file in the backend directory and update it
```bash
cp .env.example .env
```