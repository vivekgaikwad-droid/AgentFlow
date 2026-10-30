import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Workflow } from '../types';
import * as api from '../services/api';
import {
  Layers,
  Play,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
  CheckCircle2,
  Power,
  Clock,
} from 'lucide-react';

export const WorkflowManagementPage: React.FC = () => {
  const {
    workflows,
    showToast,
    refreshData,
    triggerWorkflowRun,
    setActiveView,
  } = useApp();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleEnabled = async (wf: Workflow) => {
    try {
      await api.updateWorkflow(wf.id, { enabled: !wf.enabled });
      showToast(`Workflow ${wf.name} ${!wf.enabled ? 'enabled' : 'paused'}`, 'info');
      await refreshData();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to update', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete workflow "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeletingId(id);
      await api.deleteWorkflow(id);
      showToast(`Deleted workflow "${name}"`, 'success');
      await refreshData();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to delete', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workflow Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain, trigger, configure automation schedules, and monitor your pipelines.
          </p>
        </div>

        <button
          onClick={() => setActiveView('builder')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Pipeline</span>
        </button>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-slate-900/40 border border-slate-800 rounded-xl">
            No workflows created yet. Click 'New Pipeline' to synthesize one with Gemini.
          </div>
        ) : (
          workflows.map((wf) => {
            const approvalSteps = wf.steps.filter((s) => s.requires_approval).length;

            return (
              <div
                key={wf.id}
                className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700/80 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-white">{wf.name}</h3>
                    <button
                      onClick={() => handleToggleEnabled(wf)}
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border transition-colors ${
                        wf.enabled
                          ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                          : 'text-slate-400 bg-slate-950 border-slate-800'
                      }`}
                      title="Click to toggle status"
                    >
                      {wf.enabled ? 'ACTIVE' : 'PAUSED'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    {wf.goal}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="text-blue-400 font-semibold">{wf.steps.length} steps</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {approvalSteps > 0 ? (
                        <span className="text-amber-400">{approvalSteps} approval gates</span>
                      ) : (
                        <span>Full autonomous</span>
                      )}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {wf.schedule_cron || 'Manual Execution'}
                    </span>
                    {wf.last_run_at && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>
                          Last run: {new Date(wf.last_run_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  <button
                    onClick={() => triggerWorkflowRun(wf.id)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm shadow-blue-500/20 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Now</span>
                  </button>

                  <button
                    onClick={() => handleDelete(wf.id, wf.name)}
                    disabled={deletingId === wf.id}
                    className="p-2 text-slate-400 hover:text-red-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
                    title="Delete workflow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
