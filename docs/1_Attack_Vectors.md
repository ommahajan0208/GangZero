# 1. GenAI Attack Vectors (Identify and Generate)

Traditional fraud detection systems were built to catch humans or simple bots. Generative AI fundamentally breaks these systems by enabling highly sophisticated, coordinated attacks at massive scale. 

AegisGraph specifically targets four emerging AI-powered fraud vectors

## 1. Automated Mule Network Orchestration
Instead of moving a large sum of illicit money directly, GenAI agents can coordinate hundreds of micro-transactions across "mule" accounts. 
- **Why traditional systems fail** Each individual transfer stays below velocity and volume limits, so standard rules engines never trigger an alert.
- **How AegisGraph solves it** Our GNNs look at the shape of the network. Even if individual transaction amounts look normal, the "fan-out" and "fan-in" routing patterns of a mule ring are mathematically distinct and instantly flagged.

## 2. Cross-Border Layering and Smurfing
Attackers use LLMs to script and automate complex layering sequences, moving funds across jurisdictions and converting them through intermediaries to obscure the source of funds.
- **Why traditional systems fail** By dynamically adjusting routing paths and transaction sizes, they easily evade static threshold-based Anti-Money Laundering (AML) rules.
- **How AegisGraph solves it** Layering leaves a specific topological footprint (chains and cycles). AegisGraph extracts multi-hop subgraphs to trace these chains across the network.

## 3. Synthetic Transaction Flooding
Generative models can mimic legitimate purchasing behavior perfectly, burying fraudulent transactions within realistic "noise." 
- **Why traditional systems fail** This synthetic legitimate activity shifts the statistical baselines, breaking standard anomaly detection algorithms.
- **How AegisGraph solves it** Because our AI evaluates the structural relationship between accounts, "flooding" a node with noise edges doesn't hide the illicit backbone connecting the bad actors.

## 4. Graph-Aware Evasion
Sophisticated attackers who know about graph-based detection will deliberately inject "noise" connections and bridge transactions to break up their clusters.
- **Why traditional systems fail** Naive graph algorithms (like simple clustering) get confused when bad actors deliberately link themselves to good actors.
- **How AegisGraph solves it** Our GraphSAGE model uses multi-hop feature aggregation. It learns to weight edges differently based on the neighborhood context, preventing attackers from easily camouflaging themselves.
