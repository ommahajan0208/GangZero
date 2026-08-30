import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBitcoinStore } from '../../stores/bitcoinStore';
import { useBitcoinTransaction } from '../../hooks/useBitcoinTransaction';
import PageHeader from '../../components/common/PageHeader';
import ModelSelector from '../../components/common/ModelSelector';
import RiskBadge from '../../components/common/RiskBadge';
import ProgressBar from '../../components/common/ProgressBar';
import FeatureImportanceChart from '../../components/bitcoin/FeatureImportanceChart';
import { LoadingSpinner, ErrorState, EmptyState } from '../../components/common/StateDisplays';
import { getRiskLevel } from '../../constants/riskLevels';
import { formatPercent } from '../../utils/formatters';
import { Search, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

export default function InvestigateTransaction() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSelectedTxId, selectedModel } = useBitcoinStore();
  const [inputValue, setInputValue] = useState('');
  const [activeTxId, setActiveTxId] = useState(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Read txId from URL on mount
  useEffect(() => {
    const urlTxId = searchParams.get('txId');
    if (urlTxId) {
      setInputValue(urlTxId);
      setActiveTxId(urlTxId);
      setSelectedTxId(urlTxId);
    }
  }, []);

  const { data, isLoading, error, refetch } = useBitcoinTransaction(activeTxId, selectedModel);

  const handleSearch = (e) => {
    e?.preventDefault();
    const txId = inputValue.trim();
    if (!txId) return;
    setActiveTxId(txId);
    setSelectedTxId(txId);
    setSearchParams({ txId, model: selectedModel });
  };

  const riskLevel = data ? getRiskLevel(data.risk_score) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction Investigation"
        subtitle="Enter a transaction ID for full risk breakdown with feature explanation"
      />

      {/* Search bar */}
      <div className="flex flex-col gap-2">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Transaction ID (e.g. 2374819)"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-[14px] font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
            />
          </div>
          <ModelSelector />
          <button
            type="submit"
            className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white text-[13px] font-semibold rounded-lg transition-colors shrink-0"
          >
            Search
          </button>
        </form>
        <div className="text-[13px] text-gray-500 ml-1">
          Try sample IDs: <button type="button" onClick={() => setInputValue('232629023')} className="text-red-700 hover:underline font-medium">232629023 (Illicit)</button>, <button type="button" onClick={() => setInputValue('232438397')} className="text-green-700 hover:underline font-medium">232438397 (Licit)</button>, <button type="button" onClick={() => setInputValue('230425980')} className="text-gray-700 hover:underline font-medium">230425980 (Unknown)</button>
        </div>
      </div>

      {/* Results */}
      {!activeTxId && !isLoading && (
        <EmptyState message="Enter a transaction ID above to begin investigation" />
      )}

      {isLoading && <LoadingSpinner message="Running model inference…" />}

      {error && (
        <ErrorState
          message={error.message || 'Transaction not found in dataset. Try an ID from the labeled set.'}
          onRetry={refetch}
        />
      )}

      {data && !isLoading && (
        <div className="space-y-6 animate-count-up">
          {/* Risk Score + Prediction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk Score */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="data-label mb-4">Risk Score</h3>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-[48px] font-bold font-mono text-gray-900 leading-none">
                  {Math.round(data.risk_score * 100)}%
                </span>
              </div>
              <ProgressBar value={data.risk_score} max={1} />
            </div>

            {/* Prediction */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="data-label mb-4">Prediction</h3>
              <div className="space-y-3">
                <RiskBadge level={riskLevel} />
                <div className="space-y-1 mt-4">
                  <p className="text-[13px] text-gray-600">
                    <span className="text-gray-400">Model:</span>{' '}
                    <span className="font-semibold">{data.model === 'graphsage' ? 'GraphSAGE' : 'GAT'}</span>
                  </p>
                  <p className="text-[13px] text-gray-600">
                    <span className="text-gray-400">Predicted:</span>{' '}
                    <span className="font-semibold capitalize">{data.predicted_class}</span>
                  </p>
                  <p className="text-[13px] text-gray-600">
                    <span className="text-gray-400">True Label:</span>{' '}
                    <span className="font-semibold capitalize">
                      {normalizeTrueClass(data.true_class)}
                    </span>
                  </p>
                  <p className="text-[13px] text-gray-600">
                    <span className="text-gray-400">Time Step:</span>{' '}
                    <span className="font-mono font-semibold">{data.time_step}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Importance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-semibold text-gray-900">
                Top Contributing Features
              </h3>
            </div>
            <FeatureImportanceChart features={data.top_features} maxFeatures={showAllFeatures ? 166 : 10} />
            {data.top_features?.length > 10 && (
              <button
                onClick={() => setShowAllFeatures(!showAllFeatures)}
                className="mt-3 flex items-center gap-1 text-[13px] font-medium text-red-700 hover:text-red-800 transition-colors"
              >
                {showAllFeatures ? (
                  <>Show top 10 only <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>Show all {data.top_features.length} features <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>

          {/* Graph Context */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-semibold text-gray-900">Graph Context</h3>
              <button
                onClick={() => {
                  setSelectedTxId(data.tx_id);
                  navigate('/network');
                }}
                className="flex items-center gap-1 text-[13px] font-medium text-red-700 hover:text-red-800 transition-colors"
              >
                Open Full Network <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-[24px] font-bold font-mono text-gray-900">
                  {data.neighbor_summary?.total || 0}
                </p>
                <p className="data-label mt-1">Neighbors</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-[24px] font-bold font-mono text-red-600">
                  {data.neighbor_summary?.illicit || 0}
                </p>
                <p className="data-label mt-1">Illicit Neighbors</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-[24px] font-bold font-mono text-gray-900">
                  {formatPercent(data.neighbor_summary?.depth1_avg_risk)}
                </p>
                <p className="data-label mt-1">Depth-1 Risk</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
