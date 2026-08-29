import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Network,
  Shield,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/investigate', icon: Search, label: 'Investigate Transaction' },
  { to: '/network', icon: Network, label: 'Network Explorer' },
  { to: '/rings', icon: Shield, label: 'Fraud Ring Explorer' },
  { to: '/models', icon: BarChart3, label: 'Model Comparison' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-gray-900 text-gray-300 transition-all duration-200 shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-gray-800">
          {!collapsed && (
            <span className="text-[11px] font-semibold tracking-[0.15em] text-gray-500 uppercase">
              Bitcoin Fraud
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-red-900/30 text-white border-r-2 border-red-500'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around z-30 pb-safe">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-red-400' : 'text-gray-500'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="truncate max-w-[64px]">{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
