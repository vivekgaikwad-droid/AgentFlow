import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Sparkles,
  ArrowRight,
  Play,
  AlertTriangle,
  RefreshCw,
  Calendar,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    stats,
    workflows,
    runs,
    approvals,
    jobs,
    companies,
    setActiveView,
    setSelectedRunId,
    triggerWorkflowRun,
    backendError,
    storageMode,
    refreshData,
    isLoading,
  } = useApp();

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const recentRuns = runs.slice(0, 5);
  const newJobs = jobs.filter((j) => j.is_new);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Backend Connection Error Alert (if offline) */}
      {backendError && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Backend Connection Offline:</span>
              <span className="text-red-200">{backendError}. Please ensure the server is running.</span>
            </div>
          </div>
          <button
            onClick={() => refreshData()}
            className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white font-medium rounded transition-colors shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Main Dashboard</h1>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
              Storage: {storageMode}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, workflow health indicators, and pending approval queues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setActiveView('builder')}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Workflows</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {stats?.total_workflows ?? workflows.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active pipelines</span>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Successful Runs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {stats?.successful_runs ?? 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Validated clean</span>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Failed Runs</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-200">
            {stats?.failed_runs ?? 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">0 fatal errors</span>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
            {pendingApprovals.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Human gates</span>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Tracked Targets</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {companies.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Career portals</span>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">New Jobs Found</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-cyan-400">
            {newJobs.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Deduplicated</span>
        </div>
      </div>

      {/* Pending Approvals Callout Banner (if any) */}
      {pendingApprovals.length > 0 && (
        <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {pendingApprovals.length} Human Approval Checkpoint{pendingApprovals.length > 1 ? 's' : ''} Awaiting Review
              </h3>
              <p className="text-xs text-slate-400">
                Action: {pendingApprovals[0].action} in pipeline "{pendingApprovals[0].workflow_name}"
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('approvals')}
            className="px-4 py-2 text-xs font-semibold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg transition-colors whitespace-nowrap"
          >
            Review Approvals
          </button>
        </div>
      )}

      {/* Main Grid: Recent Executions & Scheduled Automation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Runs Table */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Execution Pipeline Runs</h2>
            <button
              onClick={() => setActiveView('history')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <span>View All Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentRuns.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No executions logged yet. Click 'Create Workflow' to initiate a pipeline.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Run ID</th>
                    <th className="px-4 py-3 font-semibold">Workflow</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Duration</th>
                    <th className="px-4 py-3 font-semibold">Started</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentRuns.map((run) => (
                    <tr key={run.run_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-300 font-medium">
                        {run.run_id}
                      </td>
                      <td className="px-4 py-3 font-medium text-white truncate max-w-xs">
                        {run.workflow_name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-[11px] font-semibold ${
                            run.status === 'completed'
                              ? 'text-emerald-400'
                              : run.status === 'waiting_for_approval'
                              ? 'text-amber-400'
                              : run.status === 'running'
                              ? 'text-blue-400'
                              : 'text-red-400'
                          }`}
                        >
                          {run.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-slate-400">
                        {run.duration_seconds ? `${run.duration_seconds}s` : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                        {new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedRunId(run.run_id);
                            setActiveView('execution');
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col: Quick Execution & Scheduled Checks */}
        <div className="space-y-6">
          {/* Quick Trigger Box */}
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-white">Quick Workflow Trigger</h2>
            <p className="text-xs text-slate-400">
              Instantly run verified pipelines using the plan-act-observe loop.
            </p>

            <div className="space-y-2.5">
              {workflows.slice(0, 2).map((wf) => (
                <div
                  key={wf.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="truncate">
                    <span className="text-xs font-medium text-white block truncate">
                      {wf.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {wf.steps.length} steps · {wf.schedule_cron || 'Manual'}
                    </span>
                  </div>
                  <button
                    onClick={() => triggerWorkflowRun(wf.id)}
                    className="p-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shrink-0"
                    title="Trigger Run"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Scheduled Automation Info Box */}
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Scheduled Automation</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configured via GitHub Actions cron (<code className="text-blue-300">0 8,16 * * 1-5</code>).
              Scheduled checks run twice daily against enabled company careers portals with idempotent duplicate prevention.
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Next window:</span>
              <span className="text-slate-300">08:00 UTC (Mon-Fri)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
