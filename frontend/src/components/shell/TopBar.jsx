import { Hexagon, Activity } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20">
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <Hexagon className="w-6 h-6 text-accent" strokeWidth={2.5} />
        <span className="text-[15px] font-bold tracking-wide text-gray-900">
          AegisGraph
        </span>
        <span className="hidden sm:inline text-[13px] text-gray-400 font-medium ml-2">
          Bitcoin Fraud Detection
        </span>
      </div>

      {/* Right: System status */}
      <div className="flex items-center gap-2 text-[12px] font-medium text-gray-500 uppercase tracking-wider">
        <Activity className="w-3.5 h-3.5 text-green-500" />
        <span className="hidden sm:inline">System OK</span>
      </div>
    </header>
  );
}
