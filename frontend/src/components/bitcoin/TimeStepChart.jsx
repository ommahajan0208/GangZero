import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function TimeStepChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[13px] text-gray-400">
        No time series data
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 text-white text-[12px] rounded-lg px-3 py-2 shadow-lg">
        <p className="font-semibold mb-1">Time Step {label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }} className="flex justify-between gap-4">
            <span>{p.name}:</span>
            <span className="font-mono font-semibold">{p.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis
          dataKey="time_step"
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
          label={{ value: 'Time Step', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#9CA3AF' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
          tickFormatter={(v) => v.toLocaleString()}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          height={30}
          formatter={(value) => (
            <span className="text-[12px] font-medium text-gray-600">{value}</span>
          )}
        />
        <Line
          type="monotone"
          dataKey="illicit_count"
          name="Illicit"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#F59E0B' }}
        />
        <Line
          type="monotone"
          dataKey="licit_count"
          name="Licit"
          stroke="#16A34A"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#16A34A' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
