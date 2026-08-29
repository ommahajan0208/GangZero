import { create } from 'zustand';

export const useBitcoinStore = create((set) => ({
  selectedTxId: null,
  selectedModel: 'graphsage',       // 'graphsage' | 'gat'
  graphDepth: 1,                    // 1 | 2 | 3
  graphDirection: 'both',           // 'incoming' | 'outgoing' | 'both'
  selectedClusterId: null,
  clusterFilters: { minRisk: 0.7, minSize: 5, timeMin: 1, timeMax: 49 },

  setSelectedTxId: (txId) => set({ selectedTxId: txId }),
  setModel: (model) => set({ selectedModel: model }),
  setGraphDepth: (depth) => set({ graphDepth: depth }),
  setGraphDirection: (dir) => set({ graphDirection: dir }),
  setSelectedCluster: (id) => set({ selectedClusterId: id }),
  setClusterFilters: (filters) => set((state) => ({
    clusterFilters: { ...state.clusterFilters, ...filters },
  })),
}));
