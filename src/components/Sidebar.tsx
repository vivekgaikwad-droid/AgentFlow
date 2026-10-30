import React from 'react';
import { useApp, ActiveView } from '../context/AppContext';
import {
  LayoutDashboard,
  Cpu,
  PlaySquare,
  Briefcase,
  CheckCircle2,
  History,
  Layers,
  Settings,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface SidebarItem {
  id: ActiveView;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC<{ isOpen: boolean; onToggle: () => void }> = ({
  isOpen,
  onToggle,
}) => {
  const { activeView, setActiveView, approvals, stats, user } = useApp();
  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length;

  const navItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
    { id: 'builder', label: 'AI Workflow Builder', icon: Cpu },
    { id: 'execution', label: 'Execution View', icon: PlaySquare, badge: stats?.active_runs },
    { id: 'jobs', label: 'Job-Posting Tracker', icon: Briefcase, badge: stats?.new_jobs_discovered },
    { id: 'approvals', label: 'Approval Center', icon: CheckCircle2, badge: pendingApprovals },
    { id: 'history', label: 'Execution History', icon: History },
    { id: 'workflows', label: 'Workflow Management', icon: Layers },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-[#090D16] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header inside sidebar for mobile */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
            <span className="text-sm font-bold text-white">Navigation</span>
            <button
              onClick={onToggle}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              ✕
            </button>
          </div>

          <div className="p-3">
            <p className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Automation Workspace
            </p>
            <nav className="space-y-1 mt-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      if (window.innerWidth < 1024) onToggle();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 ? (
                      <span className="text-xs font-mono font-semibold tabular-nums text-blue-400 bg-blue-950/60 border border-blue-800/40 px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Core Lifecycle Indicator Section */}
          <div className="mx-3 mt-4 p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Autonomous Agent Loop</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex items-center justify-between">
                <span>PLAN:</span>
                <span className="text-blue-400">Gemini 3.8 Flash</span>
              </div>
              <div className="flex items-center justify-between">
                <span>ACT:</span>
                <span className="text-indigo-400">Tool Registry</span>
              </div>
              <div className="flex items-center justify-between">
                <span>APPROVE:</span>
                <span className="text-amber-400">Human-in-the-Loop</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/30">
          {user ? (
            <button
              onClick={() => setActiveView('auth')}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300 shrink-0">
                  {user.display_name?.substring(0, 2).toUpperCase() || 'US'}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-white truncate">
                    {user.display_name}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {user.email}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => setActiveView('auth')}
              className="w-full py-2 px-3 text-xs font-medium text-blue-400 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800/50 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>Sign In with Firebase</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
