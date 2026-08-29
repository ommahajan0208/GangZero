import { formatNumber } from '../../utils/formatters';

export default function ConfusionMatrix({ matrix, title }) {
  // matrix = [[TN, FP], [FN, TP]]
  if (!matrix || matrix.length !== 2) return null;

  const [[tn, fp], [fn, tp]] = matrix;
  const total = tn + fp + fn + tp;

  const Cell = ({ value, label, bgClass }) => (
    <div className={`flex flex-col items-center justify-center p-3 rounded ${bgClass}`}>
      <span className="text-[18px] font-bold font-mono text-gray-900">{formatNumber(value)}</span>
      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );

  return (
    <div>
      {title && <h4 className="text-[13px] font-semibold text-gray-700 mb-3">{title}</h4>}
      <div className="inline-block">
        {/* Column headers */}
        <div className="grid grid-cols-[80px_1fr_1fr] gap-1 mb-1">
          <div />
          <div className="text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">
            Pred Licit
          </div>
          <div className="text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">
            Pred Illicit
          </div>
        </div>

        {/* Row 1: Actual Licit */}
        <div className="grid grid-cols-[80px_1fr_1fr] gap-1 mb-1">
          <div className="flex items-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider pr-2 justify-end">
            Act Licit
          </div>
          <Cell value={tn} label="TN" bgClass="bg-green-50 border border-green-200" />
          <Cell value={fp} label="FP" bgClass="bg-red-50 border border-red-200" />
        </div>

        {/* Row 2: Actual Illicit */}
        <div className="grid grid-cols-[80px_1fr_1fr] gap-1">
          <div className="flex items-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider pr-2 justify-end">
            Act Illicit
          </div>
          <Cell value={fn} label="FN" bgClass="bg-amber-50 border border-amber-200" />
          <Cell value={tp} label="TP" bgClass="bg-green-100 border border-green-300" />
        </div>
      </div>
    </div>
  );
}
