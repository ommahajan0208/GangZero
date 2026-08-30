import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBitcoinStore } from '../../stores/bitcoinStore';
import { useFraudClusters } from '../../hooks/useFraudClusters';
import { fetchClusterDetail } from '../../api/bitcoinApi';
import PageHeader from '../../components/common/PageHeader';
import ClusterTable from '../../components/bitcoin/ClusterTable';
import TransactionGraph from '../../components/bitcoin/TransactionGraph';
import { LoadingSpinner, ErrorState } from '../../components/common/StateDisplays';
import { formatPercent, formatNumber, formatTimeRange } from '../../utils/formatters';
import { Shield } from 'lucide-react';

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function FraudRingExplorer() {
  const { clusterFilters, setClusterFilters, selectedClusterId, setSelectedCluster } = useBitcoinStore();
  const [localFilters, setLocalFilters] = useState(clusterFilters);
  const debouncedFilters = useDebounce(localFilters);

  // Sync debounced filters to store
  useEffect(() => {
    setClusterFilters(debouncedFilters);
  }, [debouncedFilters, setClusterFilters]);

  const { data: clustersData, isLoading: clustersLoading, error: clustersError } = useFraudClusters();

  const {
    data: clusterDetail,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: ['clusterDetail', selectedClusterId],
    queryFn: () => fetchClusterDetail(selectedClusterId),
    enabled: !!selectedClusterId,
    staleTime: Infinity,
  });

  const handleFilterChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectCluster = useCallback(
    (cluster) => {
      setSelectedCluster(cluster.cluster_id);
    },
    [setSelectedCluster]
  );

  // Build why-flagged explanations
  const whyFlagged = [];
  if (clusterDetail?.stats) {
    const { illicit_ratio, avg_risk_score, common_destinations_count, time_span_steps, known_illicit_count } = clusterDetail.stats;
    if (illicit_ratio > 0.3) {
      whyFlagged.push(`${Math.round(illicit_ratio * 100)}% of nodes are known illicit transactions`);
    }
    if (avg_risk_score > 0.75) {
      whyFlagged.push(`Average model risk score: ${formatPercent(avg_risk_score)}`);
    }
    if (common_destinations_count >= 2) {
      whyFlagged.push(`BTC flows converge to ${common_destinations_count} common destination addresses`);
    }
    if (time_span_steps <= 5) {
      whyFlagged.push(`All transactions fall within a ${time_span_steps}-step time window`);
    }
    if (known_illicit_count >= 1) {
      whyFlagged.push(`${known_illicit_count} known illicit node${known_illicit_count > 1 ? 's' : ''} in cluster`);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fraud Ring Explorer"
        subtitle="Pre-detected suspicious clusters with high illicit concentration"
      />

      {/* Filter bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
              Risk ≥
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={5}
              value={Math.round(localFilters.minRisk * 100)}
              onChange={(e) => handleFilterChange('minRisk', Number(e.target.value) / 100)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            <span className="text-[12px] text-gray-400">%</span>
          </div>

          <div className="w-px h-8 bg-gray-200" />

          <div className="flex items-center gap-2">
            <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
              Size ≥
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={localFilters.minSize}
              onChange={(e) => handleFilterChange('minSize', Number(e.target.value))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            <span className="text-[12px] text-gray-400">nodes</span>
          </div>

          <div className="w-px h-8 bg-gray-200" />

          <div className="flex items-center gap-2">
            <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
              Time:
            </label>
            <input
              type="number"
              min={1}
              max={49}
              value={localFilters.timeMin}
              onChange={(e) => handleFilterChange('timeMin', Number(e.target.value))}
              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            <span className="text-[12px] text-gray-400">–</span>
            <input
              type="number"
              min={1}
              max={49}
              value={localFilters.timeMax}
              onChange={(e) => handleFilterChange('timeMax', Number(e.target.value))}
              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {clustersData && (
            <span className="ml-auto text-[12px] text-gray-400">
              {clustersData.total} cluster{clustersData.total !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </div>

      {/* Cluster table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-[15px] font-semibold text-gray-900">Detected Clusters</h2>
        </div>
        <div className="p-4">
          {clustersLoading ? (
            <LoadingSpinner message="Loading clusters…" />
          ) : clustersError ? (
            <ErrorState message={clustersError.message} />
          ) : (
            <ClusterTable
              clusters={clustersData?.clusters || []}
              onSelect={handleSelectCluster}
            />
          )}
        </div>
      </div>

      {/* Selected cluster detail */}
      {selectedClusterId && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-red-600" />
            <h2 className="text-[18px] font-semibold text-gray-900">
              Selected Cluster: {selectedClusterId}
            </h2>
          </div>

          {detailLoading ? (
            <LoadingSpinner message="Loading cluster details…" />
          ) : (
            <>
              {/* Cluster graph */}
              <TransactionGraph
                nodes={clusterDetail?.nodes || []}
                edges={clusterDetail?.edges || []}
                className="min-h-[400px]"
              />

              {/* Why flagged */}
              {whyFlagged.length > 0 && (
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900 mb-3">Why Flagged</h3>
                  <ul className="space-y-2">
                    {whyFlagged.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                        <span className="text-red-500 mt-0.5">✦</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
