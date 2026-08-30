import { useBitcoinStore } from '../../stores/bitcoinStore';
import { ChevronDown } from 'lucide-react';

const MODELS = [
  { value: 'graphsage', label: 'GraphSAGE' },
  { value: 'gat', label: 'GAT' },
];

export default function ModelSelector({ className = '' }) {
  const { selectedModel, setModel } = useBitcoinStore();

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedModel}
        onChange={(e) => setModel(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-[13px] font-medium text-gray-700 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
      >
        {MODELS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
