import { useQuery } from '@tanstack/react-query';
import { fetchModelMetrics } from '../../api/bitcoinApi';
import PageHeader from '../../components/common/PageHeader';
import ConfusionMatrix from '../../components/common/ConfusionMatrix';
import { LoadingSpinner, ErrorState } from '../../components/common/StateDisplays';
import { formatMetric, formatPercent } from '../../utils/formatters';
import { Trophy, TrendingUp, Target, Activity, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const GS_COLOR = '#B91C1C';
const GAT_COLOR = '#D97706';

function MetricRow({ label, gsValue, gatValue, formatter = formatMetric }) {
  const gsNum = gsValue ?? 0;
  const gatNum = gatValue ?? 0;
  const gsWins = gsNum >= gatNum;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-[11px] text-gray-400 w-28 shrink-0 font-semibold uppercase tracking-wide">{label}</span>
      <div className="flex-1 relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute left-0 top-0 h-full rounded-full transition-all" style={{ width: `${Math.min(gsNum * 100, 100)}%`, background: GS_COLOR, opacity: gsWins ? 1 : 0.35 }} />
      </div>
      <span className="font-mono text-[14px] font-bold w-14 text-right" style={{ color: gsWins ? GS_COLOR : '#9CA3AF' }}>{formatter(gsNum)}</span>
      <span className="text-gray-300 text-[10px] shrink-0">vs</span>
      <span className="font-mono text-[14px] font-bold w-14 text-left" style={{ color: !gsWins ? GAT_COLOR : '#9CA3AF' }}>{formatter(gatNum)}</span>
      <div className="flex-1 relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute right-0 top-0 h-full rounded-full transition-all" style={{ width: `${Math.min(gatNum * 100, 100)}%`, background: GAT_COLOR, opacity: !gsWins ? 1 : 0.35 }} />
      </div>
    </div>
  );
}

export default function ModelComparison() {
  const { data: metrics, isLoading, error } = useQuery({ queryKey: ['modelMetrics'], queryFn: fetchModelMetrics, staleTime: Infinity });
  if (isLoading) return <LoadingSpinner message="Loading model metrics..." />;
  if (error) return <ErrorState message={error.message} />;

  const gs = metrics.graphsage || {};
  const gat = metrics.gat || {};
  const gsScore = (gs.f1_illicit || 0) + (gs.pr_auc || 0) + (gs.roc_auc || 0);
  const gatScore = (gat.f1_illicit || 0) + (gat.pr_auc || 0) + (gat.roc_auc || 0);
  const winner = gsScore >= gatScore ? 'GraphSAGE' : 'GAT';
  const winnerData = winner === 'GraphSAGE' ? gs : gat;
  const winnerColor = winner === 'GraphSAGE' ? GS_COLOR : GAT_COLOR;

  const barData = [
    { metric: 'PR-AUC',    GraphSAGE: gs.pr_auc || 0,           GAT: gat.pr_auc || 0 },
    { metric: 'ROC-AUC',   GraphSAGE: gs.roc_auc || 0,          GAT: gat.roc_auc || 0 },
    { metric: 'F1',        GraphSAGE: gs.f1_illicit || 0,        GAT: gat.f1_illicit || 0 },
    { metric: 'Precision', GraphSAGE: gs.precision_illicit || 0, GAT: gat.precision_illicit || 0 },
    { metric: 'Recall',    GraphSAGE: gs.recall_illicit || 0,    GAT: gat.recall_illicit || 0 },
    { metric: 'Accuracy',  GraphSAGE: gs.accuracy || 0,          GAT: gat.accuracy || 0 },
  ];

  const radarData = [
    { subject: 'PR-AUC',    GraphSAGE: (gs.pr_auc || 0) * 100,           GAT: (gat.pr_auc || 0) * 100 },
    { subject: 'ROC-AUC',   GraphSAGE: (gs.roc_auc || 0) * 100,          GAT: (gat.roc_auc || 0) * 100 },
    { subject: 'F1',        GraphSAGE: (gs.f1_illicit || 0) * 100,        GAT: (gat.f1_illicit || 0) * 100 },
    { subject: 'Precision', GraphSAGE: (gs.precision_illicit || 0) * 100, GAT: (gat.precision_illicit || 0) * 100 },
    { subject: 'Recall',    GraphSAGE: (gs.recall_illicit || 0) * 100,    GAT: (gat.recall_illicit || 0) * 100 },
    { subject: 'Accuracy',  GraphSAGE: (gs.accuracy || 0) * 100,          GAT: (gat.accuracy || 0) * 100 },
  ];

  const cmTotal = (m) => m ? m[0][0] + m[0][1] + m[1][0] + m[1][1] : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 text-white text-[12px] rounded-lg px-3 py-2 shadow-lg space-y-1">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.fill }}>
            {p.dataKey}: <span className="font-mono font-bold">{p.value.toFixed(4)}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Model Comparison - GraphSAGE vs GAT"
        subtitle={`Train: Time steps ${metrics.train_time_steps?.[0]}-${metrics.train_time_steps?.[1]} | Test: Time steps ${metrics.test_time_steps?.[0]}-${metrics.test_time_steps?.[1]}`}
      />

      {/* Winner Banner */}
      <div className="rounded-xl border-2 p-5 flex items-center gap-5" style={{ borderColor: winnerColor, background: `${winnerColor}09` }}>
        <Trophy className="w-10 h-10 shrink-0" style={{ color: winnerColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: winnerColor }}>Recommended Model</p>
          <p className="text-[26px] font-bold text-gray-900 leading-tight">{winner}</p>
          <p className="text-[12px] text-gray-500 mt-1">
            Best combined F1 + PR-AUC + ROC-AUC score on the Elliptic test set (steps {metrics.test_time_steps?.[0]}-{metrics.test_time_steps?.[1]})
          </p>
        </div>
        <div className="hidden sm:flex gap-6">
          {[
            { label: 'F1 (illicit)', val: winnerData.f1_illicit },
            { label: 'PR-AUC',      val: winnerData.pr_auc },
            { label: 'ROC-AUC',     val: winnerData.roc_auc },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">{label}</p>
              <p className="text-[22px] font-bold font-mono" style={{ color: winnerColor }}>{formatMetric(val)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Head-to-Head */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-gray-900">Head-to-Head</h3>
          <div className="flex items-center gap-4 text-[12px] font-bold">
            <span style={{ color: GS_COLOR }}>GraphSAGE</span>
            <span className="text-gray-300">vs</span>
            <span style={{ color: GAT_COLOR }}>GAT</span>
          </div>
        </div>
        <MetricRow label="PR-AUC"    gsValue={gs.pr_auc}           gatValue={gat.pr_auc} />
        <MetricRow label="ROC-AUC"   gsValue={gs.roc_auc}          gatValue={gat.roc_auc} />
        <MetricRow label="F1"        gsValue={gs.f1_illicit}        gatValue={gat.f1_illicit} />
        <MetricRow label="Precision" gsValue={gs.precision_illicit} gatValue={gat.precision_illicit} />
        <MetricRow label="Recall"    gsValue={gs.recall_illicit}    gatValue={gat.recall_illicit} />
        <MetricRow label="Accuracy"  gsValue={gs.accuracy}          gatValue={gat.accuracy} />
      </div>

      {/* Model Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { key: 'GraphSAGE', data: gs, color: GS_COLOR },
          { key: 'GAT',       data: gat, color: GAT_COLOR },
        ].map(({ key, data, color }) => (
          <div key={key} className="bg-white rounded-xl border-2 p-5 shadow-sm" style={{ borderColor: winner === key ? color : '#E5E7EB' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              <h2 className="text-[16px] font-bold text-gray-900">{key}</h2>
              {winner === key && (
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white" style={{ background: color }}>
                  Recommended
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'PR-AUC',    val: data.pr_auc,           Icon: TrendingUp },
                { label: 'ROC-AUC',   val: data.roc_auc,          Icon: Activity },
                { label: 'Accuracy',  val: data.accuracy,         Icon: Target },
                { label: 'F1',        val: data.f1_illicit,       Icon: Zap },
                { label: 'Precision', val: data.precision_illicit },
                { label: 'Recall',    val: data.recall_illicit },
              ].map(({ label, val, Icon }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    {Icon && <Icon className="w-3 h-3 text-gray-400" />}
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                  </div>
                  <p className="text-[16px] font-mono font-bold text-gray-900">{formatMetric(val)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Metric Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#4B5563' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
              <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              <Bar dataKey="GraphSAGE" fill={GS_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="GAT" fill={GAT_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Performance Profile</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#4B5563' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} tickCount={4} />
              <Radar name="GraphSAGE" dataKey="GraphSAGE" stroke={GS_COLOR} fill={GS_COLOR} fillOpacity={0.15} strokeWidth={2} />
              <Radar name="GAT" dataKey="GAT" stroke={GAT_COLOR} fill={GAT_COLOR} fillOpacity={0.1} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion Matrices */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">Confusion Matrices</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Evaluated across all {cmTotal(gs.confusion_matrix).toLocaleString()} labeled transactions in the dataset
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ConfusionMatrix title="GraphSAGE" matrix={gs.confusion_matrix} />
          <ConfusionMatrix title="GAT" matrix={gat.confusion_matrix} />
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Interpretation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1.5">Fraud Detection (Recall)</p>
            <p className="text-[13px] text-gray-700 leading-relaxed">
              GAT catches <span className="font-bold">{formatPercent(gat.recall_illicit)}</span> of actual illicit transactions vs GraphSAGE at <span className="font-bold">{formatPercent(gs.recall_illicit)}</span>. Higher recall means fewer missed frauds passing through undetected.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">False Alarm Rate (Precision)</p>
            <p className="text-[13px] text-gray-700 leading-relaxed">
              GraphSAGE generates far fewer false positives at <span className="font-bold">{formatPercent(gs.precision_illicit)}</span> vs GAT at <span className="font-bold">{formatPercent(gat.precision_illicit)}</span>. Fewer false flags reduces manual review load.
            </p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1.5">Overall Accuracy</p>
            <p className="text-[13px] text-gray-700 leading-relaxed">
              GraphSAGE achieves <span className="font-bold">{formatPercent(gs.accuracy)}</span> vs GAT at <span className="font-bold">{formatPercent(gat.accuracy)}</span>. GraphSAGE is more precise - GAT trades precision for higher recall coverage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
