import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { WorkflowRun, StepRun } from '../types';
import * as api from '../services/api';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  StopCircle,
  Terminal,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const ExecutionViewPage: React.FC = () => {
  const {
    runs,
    selectedRunId,
    setSelectedRunId,
    showToast,
    refreshData,
    setActiveView,
  } = useApp();

  const [activeRun, setActiveRun] = useState<WorkflowRun | null>(null);
  const [selectedStep, setSelectedStep] = useState<StepRun | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    if (selectedRunId) {
      const found = runs.find((r) => r.run_id === selectedRunId);
      if (found) {
        setActiveRun(found);
        setSelectedStep(found.steps[0] || null);
      }
    } else if (runs.length > 0) {
      setActiveRun(runs[0]);
      setSelectedStep(runs[0].steps[0] || null);
    }
  }, [selectedRunId, runs]);

  const handleRefreshRun = async () => {
    if (!activeRun) return;
    try {
      setIsRefreshing(true);
      const updated = await api.fetchRun(activeRun.run_id);
      setActiveRun(updated);
      await refreshData();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to refresh run', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancelRun = async () => {
    if (!activeRun) return;
    try {
      const cancelled = await api.cancelRun(activeRun.run_id);
      setActiveRun(cancelled);
      showToast('Execution run cancelled.', 'info');
      await refreshData();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to cancel', 'error');
    }
  };

  const handleApprove = async () => {
    if (!activeRun?.pending_approval_id) return;
    try {
      await api.approveRequest(activeRun.pending_approval_id);
      showToast('Action approved! Resuming pipeline...', 'success');
      await refreshData();
      const updated = await api.fetchRun(activeRun.run_id);
      setActiveRun(updated);
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to approve', 'error');
    }
  };

  const handleReject = async () => {
    if (!activeRun?.pending_approval_id) return;
    try {
      await api.rejectRequest(activeRun.pending_approval_id, rejectReason || undefined);
      showToast('Action rejected. Pipeline paused.', 'info');
      setShowRejectInput(false);
      await refreshData();
      const updated = await api.fetchRun(activeRun.run_id);
      setActiveRun(updated);
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to reject', 'error');
    }
  };

  if (!activeRun) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <h2 className="text-lg font-bold text-white">No Active Run Selected</h2>
        <p className="text-xs text-slate-400">
          Trigger a run from the Dashboard or Workflow Builder to inspect live execution.
        </p>
        <button
          onClick={() => setActiveView('dashboard')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const isWaitingApproval = activeRun.status === 'waiting_for_approval';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Bar with Run Meta & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {activeRun.workflow_name}
            </h1>
            <span
              className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                activeRun.status === 'completed'
                  ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                  : activeRun.status === 'waiting_for_approval'
                  ? 'text-amber-400 bg-amber-950/40 border-amber-800/40'
                  : activeRun.status === 'running'
                  ? 'text-blue-400 bg-blue-950/40 border-blue-800/40'
                  : 'text-red-400 bg-red-950/40 border-red-800/40'
              }`}
            >
              {activeRun.status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
            <span>Run: {activeRun.run_id}</span>
            <span aria-hidden="true">·</span>
            <span>Started: {new Date(activeRun.started_at).toLocaleTimeString()}</span>
            {activeRun.duration_seconds && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">Duration: {activeRun.duration_seconds}s</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshRun}
            disabled={isRefreshing}
            className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh State</span>
          </button>

          {activeRun.status === 'running' && (
            <button
              onClick={handleCancelRun}
              className="px-3 py-2 text-xs font-semibold text-red-300 bg-red-950/40 hover:bg-red-900/40 border border-red-800/50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Cancel Run</span>
            </button>
          )}
        </div>
      </div>

      {/* Human Approval Checkpoint Banner (if waiting) */}
      {isWaitingApproval && (
        <div className="p-5 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Execution Paused: Human Authorization Checkpoint Required
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  A protected external action (e.g. preparing/sending email notification) requires explicit confirmation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRejectInput(!showRejectInput)}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-lg"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-600/20"
              >
                Approve & Resume
              </button>
            </div>
          </div>

          {showRejectInput && (
            <div className="pt-3 border-t border-amber-500/20 flex items-center gap-3">
              <input
                type="text"
                placeholder="Reason for rejection (optional)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
              <button
                onClick={handleReject}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded"
              >
                Confirm Rejection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Visual Pipeline Ribbon */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Execution Lifecycle Pipeline
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {activeRun.steps.map((step, idx) => {
            const isSelected = selectedStep?.step_run_id === step.step_run_id;
            return (
              <React.Fragment key={step.step_run_id}>
                <button
                  onClick={() => setSelectedStep(step)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-950/40 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {step.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {step.status === 'running' && <RotateCcw className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                  {step.status === 'waiting_for_approval' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                  {step.status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-600" />}
                  {step.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-400" />}

                  <span>{step.name}</span>
                </button>
                {idx < activeRun.steps.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Step Inspector Details */}
      {selectedStep && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Cols: Step Input/Output & Telemetry */}
          <div className="md:col-span-2 p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white">{selectedStep.name}</h2>
                <span className="text-xs font-mono text-blue-400">
                  Tool: {selectedStep.tool_name}
                </span>
              </div>
              <span
                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  selectedStep.status === 'completed'
                    ? 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40'
                    : selectedStep.status === 'waiting_for_approval'
                    ? 'text-amber-400 bg-amber-950/30 border-amber-800/40'
                    : 'text-slate-400 bg-slate-950/40 border-slate-800'
                }`}
              >
                {selectedStep.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Input Summary:</span>
                <div className="p-3 bg-slate-950 rounded border border-slate-800/80 font-mono text-slate-300">
                  {selectedStep.input_summary || 'Waiting for previous step outputs to initialize.'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Observation & Output:</span>
                <div className="p-3 bg-slate-950 rounded border border-slate-800/80 font-mono text-slate-300">
                  {selectedStep.output_summary || 'No output recorded yet.'}
                </div>
              </div>

              {selectedStep.error_details && (
                <div>
                  <span className="text-red-400 font-semibold block mb-1">Error Diagnostics:</span>
                  <div className="p-3 bg-red-950/30 rounded border border-red-800/40 font-mono text-red-300">
                    {selectedStep.error_details}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Invariant Check & Timing */}
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-4 text-xs">
            <h3 className="font-semibold text-white pb-2 border-b border-slate-800">
              Execution Invariants
            </h3>

            <div className="space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Step ID:</span>
                <span className="text-slate-200">{selectedStep.step_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Retries:</span>
                <span className="text-slate-200 tabular-nums">{selectedStep.retry_count} / 3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Side Effect:</span>
                <span className="text-slate-200">
                  {selectedStep.tool_name.includes('send') ? 'Outbound' : 'Read-Only / State'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Started:</span>
                <span className="text-slate-200 tabular-nums">
                  {selectedStep.started_at ? new Date(selectedStep.started_at).toLocaleTimeString() : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Completed:</span>
                <span className="text-slate-200 tabular-nums">
                  {selectedStep.completed_at ? new Date(selectedStep.completed_at).toLocaleTimeString() : '—'}
                </span>
              </div>
            </div>

            {activeRun.final_result && (
              <div className="pt-3 border-t border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Final Result:</span>
                <p className="text-slate-300 font-sans leading-relaxed">
                  {activeRun.final_result}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
