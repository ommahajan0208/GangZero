import { useQuery } from '@tanstack/react-query';
import { fetchBitcoinStats, fetchTimeSeries, fetchModelMetrics } from '../../api/bitcoinApi';
import PageHeader from '../../components/common/PageHeader';
import MetricCard from '../../components/common/MetricCard';
import TimeStepChart from '../../components/bitcoin/TimeStepChart';
import { LoadingSpinner, ErrorState } from '../../components/common/StateDisplays';
import { formatNumber, formatPercent, formatMetric } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ArrowRight } from 'lucide-react';

export default function BitcoinDashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['bitcoinStats'],
    queryFn: fetchBitcoinStats,
    staleTime: Infinity,
  });

  const { data: timeSeries, isLoading: tsLoading } = useQuery({
    queryKey: ['bitcoinTimeSeries'],
    queryFn: fetchTimeSeries,
    staleTime: Infinity,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['modelMetrics'],
    queryFn: fetchModelMetrics,
    staleTime: Infinity,
  });

  if (statsLoading) return <LoadingSpinner message="Loading dashboard data…" />;
  if (statsError) return <ErrorState message={statsError.message} />;

  const classDistribution = [
    { name: 'Illicit', value: stats?.illicit_count || 0, color: '#DC2626' },
    { name: 'Licit', value: stats?.licit_count || 0, color: '#16A34A' },
    { name: 'Unknown', value: stats?.unknown_count || 0, color: '#9CA3AF' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bitcoin Fraud Detection — Overview"
        subtitle="Elliptic dataset analysis with GNN-based risk classification"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Transactions"
          value={formatNumber(stats?.total_transactions)}
        />
        <MetricCard
          label="Illicit"
          value={formatNumber(stats?.illicit_count)}
          color="red"
        />
        <MetricCard
          label="Licit"
          value={formatNumber(stats?.licit_count)}
          color="green"
        />
        <MetricCard
          label="Unknown"
          value={formatNumber(stats?.unknown_count)}
          color="gray"
        />
        <MetricCard
          label="Illicit Rate"
          value={formatPercent(stats?.illicit_rate_labeled)}
          subLabel="Among labeled transactions only"
          color="amber"
        />
      </div>

      {/* Time Step Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-[18px] font-semibold text-gray-900 mb-4">
          Illicit vs Licit by Time Step
        </h2>
        {tsLoading ? (
          <LoadingSpinner message="Loading time series…" />
        ) : (
          <TimeStepChart data={timeSeries} />
        )}
      </div>

      {/* Bottom row: Model Performance + Class Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Model Performance Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-semibold text-gray-900">
              Model Performance Summary
            </h2>
            <button
              onClick={() => navigate('/models')}
              className="flex items-center gap-1 text-[13px] font-medium text-red-700 hover:text-red-800 transition-colors"
            >
              View Full Comparison <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {metricsLoading ? (
            <LoadingSpinner />
          ) : metrics ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="text-right py-2 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      PR-AUC
                    </th>
                    <th className="text-right py-2 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      ROC-AUC
                    </th>
                    <th className="text-right py-2 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      F1
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {['graphsage', 'gat'].map((model) => (
                    <tr key={model} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-semibold text-gray-800">
                        {model === 'graphsage' ? 'GraphSAGE' : 'GAT'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-gray-700">
                        {formatMetric(metrics[model]?.pr_auc)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-gray-700">
                        {formatMetric(metrics[model]?.roc_auc)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-gray-700">
                        {formatMetric(metrics[model]?.f1_illicit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {/* Class Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-[18px] font-semibold text-gray-900 mb-4">
            Class Distribution
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={classDistribution} layout="vertical" margin={{ left: 10, right: 30 }}>
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                tickFormatter={(v) => v.toLocaleString()}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={70}
                tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => v.toLocaleString()}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {classDistribution.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-gray-400 mt-3 italic">
            * Illicit rate of {formatPercent(stats?.illicit_rate_labeled)} is computed
            among labeled transactions only — {formatNumber(stats?.unknown_count)} unknown
            transactions excluded.
          </p>
        </div>
      </div>
    </div>
  );
}
