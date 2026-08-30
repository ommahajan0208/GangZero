# 2. Defense - Graph Neural Networks (GNNs)

AegisGraph is powered by Graph Neural Networks (GNNs). Unlike traditional machine learning models that look at transactions in isolation, GNNs evaluate the entire shape and topology of the payment network to catch coordinated fraud.

## Why We Replaced Tabular Models
Traditional fraud detection relies on tabular classifiers (like XGBoost or Random Forest) fed with features like transaction amount, time, and merchant category. 
- **The flaw** These models treat each transaction as an independent row of data. Criminals know this and operate in networks to evade them.
- **The solution** Graph Neural Networks learn by aggregating information from a transaction's surrounding neighborhood. This captures the structural signals (mule chains, fan-out patterns, ring topologies) that traditional models are blind to.

## Dual-Model Architecture

We implemented two different GNN architectures to balance precision and recall

### 1. GraphSAGE (Primary Model)
- **Mechanism** Samples and aggregates features from a node's local neighborhood.
- **Advantage** It is inductive, meaning it can seamlessly evaluate brand-new, unseen transactions without needing to be retrained.
- **Result** Achieved the highest F1 Score (0.59) and Precision (58%), minimizing false positives.

### 2. GAT (Graph Attention Network)
- **Mechanism** Uses attention mechanisms to learn which neighboring transactions matter the most when evaluating a specific node.
- **Advantage** Highly effective at catching complex, heavily disguised fraud patterns (higher Recall).

## Overcoming Training Challenges

### 1. Strict Temporal Split
Randomly shuffling data would allow the model to cheat by seeing the future. We enforced a strict time-based split, train on time steps 1 to 29, validate on 30 to 34, and test on 35 to 49. This simulates a real-world deployment where the model must catch never-before-seen transaction patterns.

### 2. Extreme Class Imbalance (9 to 1 Licit to Illicit)
Only 9.76% of transactions in our dataset were fraudulent. We solved this by using a class-weighted CrossEntropy loss (giving illicit nodes ~9x more importance). This forces the AI to pay close attention to illicit patterns rather than ignoring them to artificially boost accuracy.

## The Random Forest Elephant in the Room
In raw metrics on historical data, Random Forest might appear to outperform GNNs. This happens because our historical dataset (Elliptic) includes pre-computed aggregate features that Random Forest memorizes. However, against our live GenAI attacks, tabular models fail immediately because attackers simply shift transaction volumes to mask local features. GraphSAGE dynamically evaluates multi-hop network topology in real-time, making it significantly more robust against evasion.
