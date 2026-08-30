import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { truncate } from '../../utils/formatters';

export default function FeatureImportanceChart({ features = [], maxFeatures = 10 }) {
  const data = features.slice(0, maxFeatures).map((f) => ({
    name: f.name,
    importance: Math.abs(f.importance),
    value: f.value,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[13px] text-gray-400">
        No feature importance data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-gray-900 text-white text-[12px] rounded-lg px-3 py-2 shadow-lg">
        <p className="font-medium font-mono">{d.name}</p>
        <p className="text-gray-300 mt-1">
          Importance: <span className="text-white font-semibold">{d.importance.toFixed(3)}</span>
        </p>
        {d.value != null && (
          <p className="text-gray-300">
            Value: <span className="text-white font-semibold">{d.value.toFixed(3)}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 32)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
        <XAxis
          type="number"
          tickFormatter={(v) => v.toFixed(2)}
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tickFormatter={(name) => truncate(name, 20)}
          tick={{ fontSize: 11, fill: '#374151', fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        <Bar dataKey="importance" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? '#B91C1C' : '#DC2626'} fillOpacity={1 - i * 0.06} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
