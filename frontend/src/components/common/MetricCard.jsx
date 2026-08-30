export default function MetricCard({ label, value, subLabel, color, icon: Icon }) {
  const dotColor = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    gray: 'bg-gray-400',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
  }[color] || 'bg-gray-400';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        {color && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
        <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
        <span className="text-[28px] font-bold text-gray-900 leading-tight font-mono">
          {value}
        </span>
      </div>
      {subLabel && (
        <p className="text-[12px] text-gray-400 mt-1">{subLabel}</p>
      )}
    </div>
  );
}
