import { useQuery } from '@tanstack/react-query';
import { fetchTransaction } from '../api/bitcoinApi';
import { useBitcoinStore } from '../stores/bitcoinStore';

export const useBitcoinTransaction = (txIdOverride, modelOverride) => {
  const { selectedTxId, selectedModel } = useBitcoinStore();
  const txId = txIdOverride || selectedTxId;
  const model = modelOverride || selectedModel;

  return useQuery({
    queryKey: ['transaction', txId, model],
    queryFn: () => fetchTransaction(txId, model),
    enabled: !!txId,
    staleTime: Infinity, // dataset is static - no refetching needed
    retry: 1,
  });
};
