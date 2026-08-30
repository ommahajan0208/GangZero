import { useQuery } from '@tanstack/react-query';
import { fetchModelMetrics } from '../../api/bitcoinApi';
import PageHeader from '../../components/common/PageHeader';
import ConfusionMatrix from '../../components/common/ConfusionMatrix';
import { LoadingSpinner, ErrorState } from '../../components/common/StateDisplays';
import { formatMetric } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function ModelComparison() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['modelMetrics'],
    queryFn: fetchModelMetrics,
    staleTime: Infinity,
  });

  if (isLoading) return <LoadingSpinner message="Loading model metrics…" />;
  if (error) return <ErrorState message={error.message} />;

  const chartData = [
    {
      metric: 'PR-AUC',
      GraphSAGE: metrics.graphsage?.pr_auc || 0,
      GAT: metrics.gat?.pr_auc || 0,
    },
    {
      metric: 'ROC-AUC',
      GraphSAGE: metrics.graphsage?.roc_auc || 0,
      GAT: metrics.gat?.roc_auc || 0,
    },
    {
      metric: 'F1 (illicit)',
      GraphSAGE: metrics.graphsage?.f1_illicit || 0,
      GAT: metrics.gat?.f1_illicit || 0,
    },
    {
      metric: 'Precision',
      GraphSAGE: metrics.graphsage?.precision_illicit || 0,
      GAT: metrics.gat?.precision_illicit || 0,
    },
    {
      metric: 'Recall',
      GraphSAGE: metrics.graphsage?.recall_illicit || 0,
      GAT: metrics.gat?.recall_illicit || 0,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Model Comparison — GraphSAGE vs GAT"
        subtitle={`Train: Time steps ${metrics.train_time_steps?.[0]}–${metrics.train_time_steps?.[1]} | Test: Time steps ${metrics.test_time_steps?.[0]}–${metrics.test_time_steps?.[1]}`}
      />

      {/* Metrics Table / Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GraphSAGE */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-[16px] font-semibold text-gray-900 border-b border-gray-100 pb-2">
            GraphSAGE
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="data-label">PR-AUC</p>
              <p className="text-[18px] font-mono font-semibold text-gray-900">{formatMetric(metrics.graphsage?.pr_auc)}</p>
            </div>
            <div>
              <p className="data-label">ROC-AUC</p>
              <p className="text-[18px] font-mono font-semibold text-gray-900">{formatMetric(metrics.graphsage?.roc_auc)}</p>
            </div>
            <div>
              <p className="data-label">F1 (illicit)</p>
              <p className="text-[18px] font-mono font-semibold text-gray-900">{formatMetric(metrics.graphsage?.f1_illicit)}</p>
            </div>
            <div>
              <p className="data-label">Precision</p>
              <p className="text-[18px] font-mono font-semibold text-gray-900">{formatMetric(metrics.graphsage?.precision_illicit)}</p>
            </div>
            <div>
              <p className="data-label">Recall</p>
              <p className="text-[18px] font-mono font-semibold text-gray-900">{formatMetric(metrics.graphsage?.recall_illicit)}</p>
            </div>
          </div>
        </div>

        {/* GAT */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-[16px] font-semibold text-gray-900 border-b border-gray-100 pb-2">
            GAT
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="data-label">PR-AUC</p>
              <p className="text-[18px] font-mono font-semibold text-gray-900">{formatMetric(metrics.gat?.pr_auc)}</p>
            </div>
            <div>
              <p className="data-label">ROC-AUC</p>
              <p className="text-[18px] font-mono font-semibold text-gray-900">{formatMetric(metrics.gat?.roc_auc)}</p>
            </div>
            <div>
              <p className="data-label">F1 (illicit)</p>
              <p className="text-[18px] font-mono font-semibold text-gray-900">{formatMetric(metrics.gat?.f1_illicit)}</p>
            </div>
            <div>
              <p className="data-label">Precision</p>
              <p className="text-[18px] font-mono font-semibold text-gray-900">{formatMetric(metrics.gat?.precision_illicit)}</p>
            </div>
            <div>
              <p className="data-label">Recall</p>
              <p className="text-[18px] font-mono font-semibold text-gray-900">{formatMetric(metrics.gat?.recall_illicit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grouped Bar Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-6">Metric Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#4B5563' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#4B5563' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} domain={[0, 1]} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E5E7EB' }}
              cursor={{ fill: '#F9FAFB' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 500 }} />
            <Bar dataKey="GraphSAGE" fill="#B91C1C" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="GAT" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Confusion Matrices */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-6">Confusion Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ConfusionMatrix title="GraphSAGE" matrix={metrics.graphsage?.confusion_matrix} />
          <ConfusionMatrix title="GAT" matrix={metrics.gat?.confusion_matrix} />
        </div>
      </div>
    </div>
  );
}
