import { XCircle, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

const RISK_CONFIG = {
  high: {
    label: 'HIGH RISK',
    icon: XCircle,
    classes: 'bg-red-600 text-white',
  },
  suspicious: {
    label: 'SUSPICIOUS',
    icon: AlertTriangle,
    classes: 'bg-amber-100 text-amber-800 border border-amber-400',
  },
  verified: {
    label: 'VERIFIED',
    icon: CheckCircle,
    classes: 'bg-green-600 text-white',
  },
  unknown: {
    label: 'UNKNOWN',
    icon: HelpCircle,
    classes: 'bg-gray-100 text-gray-600',
  },
};

export default function RiskBadge({ level = 'unknown', size = 'md' }) {
  const config = RISK_CONFIG[level] || RISK_CONFIG.unknown;
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-[12px] px-3 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-wide uppercase ${config.classes} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
}
