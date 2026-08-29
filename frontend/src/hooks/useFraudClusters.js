import { useQuery } from '@tanstack/react-query';
import { fetchClusters } from '../api/bitcoinApi';
import { useBitcoinStore } from '../stores/bitcoinStore';

export const useFraudClusters = () => {
  const { clusterFilters } = useBitcoinStore();

  return useQuery({
    queryKey: ['clusters', clusterFilters],
    queryFn: () =>
      fetchClusters({
        min_risk: clusterFilters.minRisk,
        min_size: clusterFilters.minSize,
        time_step_min: clusterFilters.timeMin,
        time_step_max: clusterFilters.timeMax,
      }),
    staleTime: Infinity,
  });
};
