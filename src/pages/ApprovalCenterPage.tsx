import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ApprovalRequest } from '../types';
import * as api from '../services/api';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';

export const ApprovalCenterPage: React.FC = () => {
  const { approvals, showToast, refreshData } = useApp();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filter, setFilter] = useState<'pending' | 'decided' | 'all'>('pending');

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const decidedApprovals = approvals.filter((a) => a.status !== 'pending');

  const displayedApprovals =
    filter === 'pending'
      ? pendingApprovals
      : filter === 'decided'
      ? decidedApprovals
      : approvals;

  const handleApprove = async (id: string, actionName: string) => {
    try {
      await api.approveRequest(id);
      showToast(`Approved action: ${actionName}`, 'success');
      await refreshData();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to approve', 'error');
    }
  };

  const handleRejectConfirm = async (id: string) => {
    try {
      await api.rejectRequest(id, rejectReason || undefined);
      showToast('Action rejected and blocked from execution', 'info');
      setRejectingId(null);
      setRejectReason('');
      await refreshData();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to reject', 'error');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Approval Center</h1>
            {pendingApprovals.length > 0 && (
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                {pendingApprovals.length} PENDING
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Backend-enforced security checkpoints. Protected outbound side effects pause until explicitly authorized by a human.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'pending'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setFilter('decided')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'decided'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            History ({decidedApprovals.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {displayedApprovals.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-slate-900/30 border border-slate-800 rounded-xl">
            <CheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
            No {filter} approval checkpoints found. All executions are currently nominal.
          </div>
        ) : (
          displayedApprovals.map((req) => {
            const isExpanded = expandedId === req.id;
            const isPending = req.status === 'pending';
            const isRejecting = rejectingId === req.id;

            return (
              <div
                key={req.id}
                className={`p-5 rounded-xl border transition-all ${
                  isPending
                    ? 'bg-slate-900/50 border-amber-500/30 shadow-sm'
                    : 'bg-slate-900/20 border-slate-800 opacity-90'
                }`}
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-bold text-white">{req.action}</h3>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                          req.status === 'pending'
                            ? 'text-amber-400 bg-amber-950/40 border-amber-800/40'
                            : req.status === 'approved'
                            ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                            : 'text-red-400 bg-red-950/40 border-red-800/40'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <span>Pipeline: {req.workflow_name}</span>
                      <span aria-hidden="true">·</span>
                      <span>Run ID: {req.run_id}</span>
                      <span aria-hidden="true">·</span>
                      <span>Requested: {new Date(req.requested_at).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Actions or Decided Details */}
                  {isPending ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setRejectingId(isRejecting ? null : req.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req.id, req.action)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm shadow-emerald-600/20"
                      >
                        Authorize & Execute
                      </button>
                    </div>
                  ) : (
                    <div className="text-right text-xs font-mono text-slate-400">
                      <div>Decided by: {req.decided_by || 'reviewer'}</div>
                      {req.rejection_reason && (
                        <div className="text-red-400 text-[11px] mt-0.5">
                          Reason: {req.rejection_reason}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reason Banner */}
                <div className="mt-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs text-slate-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Security Reason: </span>
                    {req.reason}
                  </div>
                </div>

                {/* Reject Input Drawer */}
                {isRejecting && (
                  <div className="mt-3 p-3 bg-red-950/20 border border-red-800/40 rounded-lg flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Specify optional rejection rationale..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-red-500"
                    />
                    <button
                      onClick={() => handleRejectConfirm(req.id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded"
                    >
                      Confirm Reject
                    </button>
                  </div>
                )}

                {/* Expandable Details Accordion */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="text-slate-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Payload Details' : 'Inspect Proposed Action Details'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <span className="text-[11px] font-mono text-slate-500">
                    Target: {req.details.target_service || 'External API'}
                  </span>
                </div>

                {isExpanded && (
                  <div className="mt-3 p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
                    {req.details.recipient && (
                      <div>
                        <span className="text-slate-400">Recipient: </span>
                        <span className="text-blue-300">{req.details.recipient}</span>
                      </div>
                    )}
                    {req.details.subject && (
                      <div>
                        <span className="text-slate-400">Subject: </span>
                        <span className="text-white font-semibold">{req.details.subject}</span>
                      </div>
                    )}
                    {req.details.body_preview && (
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-slate-400 block mb-1">Message Preview:</span>
                        <pre className="p-3 bg-slate-900 rounded font-sans text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {req.details.body_preview}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
