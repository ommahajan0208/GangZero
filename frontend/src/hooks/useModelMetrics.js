import { useQuery } from '@tanstack/react-query';
import { fetchModelMetrics } from '../api/bitcoinApi';

export const useModelMetrics = () => {
  return useQuery({
    queryKey: ['modelMetrics'],
    queryFn: fetchModelMetrics,
    staleTime: Infinity, // metrics are pre-computed, never change
  });
};
