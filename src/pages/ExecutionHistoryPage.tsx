import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WorkflowRun } from '../types';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  StopCircle,
  FileText,
  ChevronRight,
  ChevronDown,
  Terminal,
} from 'lucide-react';

export const ExecutionHistoryPage: React.FC = () => {
  const { runs, setSelectedRunId, setActiveView } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const filteredRuns = runs.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.run_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.workflow_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Execution History & Logs</h1>
          <p className="text-xs text-slate-400 mt-1">
            Searchable historical execution ledger with telemetry, step timing, and redacted input/output logs.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total Logged Runs: <span className="text-white font-bold tabular-nums">{runs.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Run ID or Workflow Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="waiting_for_approval">Waiting for Approval</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono tabular-nums">
          Showing {filteredRuns.length} runs
        </span>
      </div>

      {/* Runs Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
        {filteredRuns.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No execution runs found matching your search.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredRuns.map((run) => {
              const isExpanded = expandedRunId === run.run_id;
              const completedCount = run.steps.filter((s) => s.status === 'completed').length;
              const failedCount = run.steps.filter((s) => s.status === 'failed').length;

              return (
                <div key={run.run_id} className="p-4 hover:bg-slate-800/20 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white text-sm">
                          {run.workflow_name}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                            run.status === 'completed'
                              ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                              : run.status === 'waiting_for_approval'
                              ? 'text-amber-400 bg-amber-950/40 border-amber-800/40'
                              : run.status === 'running'
                              ? 'text-blue-400 bg-blue-950/40 border-blue-800/40'
                              : 'text-red-400 bg-red-950/40 border-red-800/40'
                          }`}
                        >
                          {run.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                        <span className="text-slate-300 font-semibold">{run.run_id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          Started {new Date(run.started_at).toLocaleString()}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          Duration: {run.duration_seconds ? `${run.duration_seconds}s` : '—'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          Steps: {completedCount}/{run.steps.length} passed
                        </span>
                        {failedCount > 0 && (
                          <span className="text-red-400 font-bold tabular-nums">
                            ({failedCount} failed)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedRunId(isExpanded ? null : run.run_id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide Logs' : 'View Logs'}</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedRunId(run.run_id);
                          setActiveView('execution');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                      >
                        Inspect Pipeline
                      </button>
                    </div>
                  </div>

                  {/* Expanded Logs Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                        Step Execution Telemetry & Diagnostics
                      </div>

                      <div className="space-y-2">
                        {run.steps.map((step, idx) => (
                          <div
                            key={step.step_run_id || idx}
                            className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-white font-semibold">
                                {idx + 1}. {step.name} [{step.tool_name}]
                              </span>
                              <span
                                className={`text-[10px] font-semibold ${
                                  step.status === 'completed'
                                    ? 'text-emerald-400'
                                    : step.status === 'waiting_for_approval'
                                    ? 'text-amber-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {step.status.toUpperCase()}
                              </span>
                            </div>

                            {step.input_summary && (
                              <div className="text-slate-400 text-[11px]">
                                <span className="text-slate-500">IN:</span> {step.input_summary}
                              </div>
                            )}

                            {step.output_summary && (
                              <div className="text-slate-300 text-[11px]">
                                <span className="text-slate-500">OUT:</span> {step.output_summary}
                              </div>
                            )}

                            {step.error_details && (
                              <div className="text-red-400 text-[11px]">
                                <span className="text-red-500 font-bold">ERR:</span> {step.error_details}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {run.final_result && (
                        <div className="p-3 bg-slate-900/60 rounded border border-slate-800 text-xs text-slate-300">
                          <span className="text-slate-400 font-semibold font-mono">Summary: </span>
                          {run.final_result}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
