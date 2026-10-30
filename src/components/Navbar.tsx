import React from 'react';
import { useApp } from '../context/AppContext';
import { GitBranch, Shield, Bell, Terminal } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeView, setActiveView, approvals, user } = useApp();
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-[#090D16]/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark with connected-node motif */}
      <button
        onClick={() => setActiveView('landing')}
        className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
          <GitBranch className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            AgentFlow
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide">
            From Prompts to Action
          </span>
        </div>
      </button>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`whitespace-nowrap transition-colors hover:text-white ${
            activeView === 'dashboard' ? 'text-blue-400 font-semibold' : ''
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveView('builder')}
          className={`whitespace-nowrap transition-colors hover:text-white ${
            activeView === 'builder' ? 'text-blue-400 font-semibold' : ''
          }`}
        >
          Workflow Builder
        </button>
        <button
          onClick={() => setActiveView('jobs')}
          className={`whitespace-nowrap transition-colors hover:text-white ${
            activeView === 'jobs' ? 'text-blue-400 font-semibold' : ''
          }`}
        >
          Job Tracker
        </button>
        <button
          onClick={() => setActiveView('approvals')}
          className={`flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white ${
            activeView === 'approvals' ? 'text-blue-400 font-semibold' : ''
          }`}
        >
          <span>Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="text-xs font-mono text-amber-400 font-bold tabular-nums">
              [{pendingApprovalsCount}]
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`whitespace-nowrap transition-colors hover:text-white ${
            activeView === 'history' ? 'text-blue-400 font-semibold' : ''
          }`}
        >
          Execution Logs
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveView('builder')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-sm shadow-blue-500/20 whitespace-nowrap flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>New Workflow</span>
        </button>
      </div>
    </header>
  );
};
