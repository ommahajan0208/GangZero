import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBitcoinStore } from '../../stores/bitcoinStore';
import { useTransactionGraph } from '../../hooks/useTransactionGraph';
import PageHeader from '../../components/common/PageHeader';
import ModelSelector from '../../components/common/ModelSelector';
import TransactionGraph from '../../components/bitcoin/TransactionGraph';
import RiskBadge from '../../components/common/RiskBadge';
import { LoadingSpinner, ErrorState, EmptyState } from '../../components/common/StateDisplays';
import { getRiskLevel } from '../../constants/riskLevels';
import { formatPercent } from '../../utils/formatters';
import { Search, Network } from 'lucide-react';

export default function NetworkExplorer() {
  const navigate = useNavigate();
  const {
    selectedTxId,
    setSelectedTxId,
    graphDepth,
    setGraphDepth,
    graphDirection,
    setGraphDirection,
  } = useBitcoinStore();

  const [inputValue, setInputValue] = useState(selectedTxId || '');
  const [activeTxId, setActiveTxId] = useState(selectedTxId);
  const [selectedNode, setSelectedNode] = useState(null);

  const { data, isLoading, error } = useTransactionGraph(activeTxId);

  // When selected txId changes from store (e.g., navigated here from Investigate)
  useEffect(() => {
    if (selectedTxId && selectedTxId !== activeTxId) {
      setInputValue(selectedTxId);
      setActiveTxId(selectedTxId);
    }
  }, [selectedTxId]);

  const handleLoad = (e) => {
    e?.preventDefault();
    const txId = inputValue.trim();
    if (!txId) return;
    setActiveTxId(txId);
    setSelectedTxId(txId);
    setSelectedNode(null);
  };

  const handleNodeSelect = (nodeId) => {
    const node = data?.nodes?.find((n) => String(n.id) === String(nodeId));
    setSelectedNode(node || { id: nodeId });
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <PageHeader
        title="Network Explorer"
        subtitle="Interactive transaction graph — visualize neighborhoods"
      />

      {/* Toolbar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Center node input */}
          <div className="flex flex-col gap-1.5">
            <form onSubmit={handleLoad} className="flex items-center gap-2">
              <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider shrink-0">
                Center:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="txId"
                  className="w-36 pl-3 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white text-[13px] font-semibold rounded-lg transition-colors"
              >
                Load
              </button>
            </form>
            <div className="text-[11px] text-gray-500">
              Samples: <button type="button" onClick={() => setInputValue('232629023')} className="text-red-700 hover:underline">232629023 (Illicit)</button>, <button type="button" onClick={() => setInputValue('232438397')} className="text-green-700 hover:underline">232438397 (Licit)</button>, <button type="button" onClick={() => setInputValue('230425980')} className="text-gray-700 hover:underline">230425980 (Unknown)</button>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-200" />

          {/* Depth selector */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
              Depth:
            </span>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  onClick={() => setGraphDepth(d)}
                  className={`px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                    graphDepth === d
                      ? 'bg-red-700 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-8 bg-gray-200" />

          {/* Direction toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
              Direction:
            </span>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              {['incoming', 'outgoing', 'both'].map((dir) => (
                <button
                  key={dir}
                  onClick={() => setGraphDirection(dir)}
                  className={`px-3 py-1.5 text-[12px] font-medium capitalize transition-colors ${
                    graphDirection === dir
                      ? 'bg-red-700 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-8 bg-gray-200" />

          <ModelSelector />
        </div>
      </div>

      {/* Graph + Detail panel */}
      {!activeTxId ? (
        <EmptyState
          message="Enter a transaction ID and click Load to visualize its network"
          icon={Network}
        />
      ) : isLoading ? (
        <LoadingSpinner message="Building subgraph…" />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 min-h-[500px]">
          {/* Graph */}
          <TransactionGraph
            nodes={data?.nodes || []}
            edges={data?.edges || []}
            selectedNodeId={selectedNode?.id}
            onNodeSelect={handleNodeSelect}
            className="min-h-[500px]"
          />

          {/* Node detail panel */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm overflow-y-auto">
            {selectedNode ? (
              <div className="space-y-4">
                <h3 className="text-[15px] font-semibold text-gray-900">Selected Node</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-400">txId:</span>
                    <span className="font-mono font-semibold text-gray-800">{selectedNode.id}</span>
                  </div>
                  {selectedNode.risk_score != null && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Risk:</span>
                      <span className="font-mono font-semibold text-gray-800">
                        {formatPercent(selectedNode.risk_score)}
                      </span>
                    </div>
                  )}
                  {selectedNode.true_class && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Class:</span>
                      <span className="font-semibold capitalize text-gray-800">
                        {selectedNode.true_class}
                      </span>
                    </div>
                  )}
                  {selectedNode.time_step && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Time Step:</span>
                      <span className="font-mono font-semibold text-gray-800">
                        {selectedNode.time_step}
                      </span>
                    </div>
                  )}
                  {selectedNode.risk_score != null && (
                    <div className="mt-3">
                      <RiskBadge level={getRiskLevel(selectedNode.risk_score, selectedNode.true_class)} />
                    </div>
                  )}
                </div>

                {/* Neighbor stats */}
                {data?.nodes && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="data-label mb-3">Neighbors</h4>
                    <div className="space-y-1 text-[13px]">
                      {(() => {
                        const edges = data.edges || [];
                        const nodeId = String(selectedNode.id);
                        const neighborIds = new Set();
                        edges.forEach((e) => {
                          if (String(e.source) === nodeId) neighborIds.add(String(e.target));
                          if (String(e.target) === nodeId) neighborIds.add(String(e.source));
                        });
                        const neighbors = data.nodes.filter((n) => neighborIds.has(String(n.id)));
                        const illicit = neighbors.filter((n) => n.true_class === 'illicit' || n.true_class === '1').length;
                        const licit = neighbors.filter((n) => n.true_class === 'licit' || n.true_class === '2').length;
                        const unknown = neighbors.length - illicit - licit;
                        return (
                          <>
                            <p><span className="text-red-500">●</span> {illicit} illicit</p>
                            <p><span className="text-green-500">●</span> {licit} licit</p>
                            <p><span className="text-gray-400">●</span> {unknown} unknown</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedTxId(String(selectedNode.id));
                    navigate('/investigate?txId=' + selectedNode.id + '&model=' + useBitcoinStore.getState().selectedModel);
                  }}
                  className="w-full mt-4 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white text-[13px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" /> Investigate
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Network className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-[13px] text-gray-400">Click a node in the graph to see its details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
