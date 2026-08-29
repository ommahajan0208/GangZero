export default function ProgressBar({ value = 0, max = 1, label, color }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  const barColor = color || (pct >= 75 ? 'bg-red-600' : pct >= 50 ? 'bg-amber-500' : 'bg-green-600');

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-[12px] font-medium text-gray-600">{label}</span>
          <span className="text-[13px] font-semibold font-mono text-gray-800">
            {pct.toFixed(0)}%
          </span>
        </div>
      )}
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
