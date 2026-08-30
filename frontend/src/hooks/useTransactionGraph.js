import { useQuery } from '@tanstack/react-query';
import { fetchTransactionGraph } from '../api/bitcoinApi';
import { useBitcoinStore } from '../stores/bitcoinStore';

export const useTransactionGraph = (txIdOverride) => {
  const { selectedTxId, graphDepth, graphDirection, selectedModel } = useBitcoinStore();
  const txId = txIdOverride || selectedTxId;

  return useQuery({
    queryKey: ['graph', txId, graphDepth, graphDirection, selectedModel],
    queryFn: () => fetchTransactionGraph(txId, graphDepth, graphDirection, selectedModel),
    enabled: !!txId,
    staleTime: Infinity,
  });
};
