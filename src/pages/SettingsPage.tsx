import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import {
  Settings,
  Server,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Bell,
  User,
  Database,
  ExternalLink,
  Info,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, showToast } = useApp();

  const [backendHealth, setBackendHealth] = useState<Record<string, unknown> | null>(null);
  const [checkingBackend, setCheckingBackend] = useState(false);

  const [digestEmail, setDigestEmail] = useState(() => {
    return localStorage.getItem('agentflow_digest_email') || user?.email || 'admin@agentflow.io';
  });

  const [notifyOnApproval, setNotifyOnApproval] = useState(() => {
    return localStorage.getItem('agentflow_notify_approval') !== 'false';
  });

  const [notifyOnFailure, setNotifyOnFailure] = useState(() => {
    return localStorage.getItem('agentflow_notify_failure') !== 'false';
  });

  const testBackendConnection = async () => {
    try {
      setCheckingBackend(true);
      const res = await api.fetchHealth();
      setBackendHealth(res);
      showToast('Backend health verified: ' + (res.service || 'OK'), 'success');
    } catch (err: unknown) {
      setBackendHealth({ status: 'error', error: (err as Error).message });
      showToast('Failed to reach backend: ' + (err as Error).message, 'error');
    } finally {
      setCheckingBackend(false);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('agentflow_digest_email', digestEmail);
    localStorage.setItem('agentflow_notify_approval', String(notifyOnApproval));
    localStorage.setItem('agentflow_notify_failure', String(notifyOnFailure));
    showToast('Preferences successfully saved to persistent configuration.', 'success');
  };

  useEffect(() => {
    testBackendConnection();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Inspect integration telemetry, model orchestration, database persistence mode, and notification channels.
        </p>
      </div>

      {/* Integration Verification Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Active Integrations & Services
          </h2>
          <button
            onClick={testBackendConnection}
            disabled={checkingBackend}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingBackend ? 'animate-spin' : ''}`} />
            <span>Test Health</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Backend Card */}
          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Server className="w-4 h-4 text-blue-400" />
                <span>Backend API</span>
              </div>
              {backendHealth?.status === 'ok' ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded font-bold">
                  HEALTHY
                </span>
              ) : (
                <span className="text-[10px] font-mono text-red-400 bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded font-bold">
                  OFFLINE
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              FastAPI / Full-stack Express engine with Plan-Act-Observe loop and tool allowlists.
            </p>

            <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/80">
              Endpoint: <code className="text-slate-300">GET /health</code>
            </div>
          </div>

          {/* Gemini AI Card */}
          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Google Gemini API</span>
              </div>
              {backendHealth?.gemini_configured ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded font-bold">
                  CONNECTED
                </span>
              ) : (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded font-bold">
                  FALLBACK ENGINE
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Model reasoning used for goal decomposition into multi-step execution graphs.
            </p>

            <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/80">
              Model: <code className="text-slate-300">{(backendHealth?.gemini_model as string) || 'gemini-3.8-flash'}</code>
            </div>
          </div>

          {/* Persistence Mode Card */}
          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Storage Layer</span>
              </div>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded font-bold uppercase">
                {(backendHealth?.storage_mode as string) || 'local_development'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {backendHealth?.storage_mode === 'firestore'
                ? 'Cloud Firestore persistent collections for workflows, runs, and audit logs.'
                : 'Local disk state persistence (survives restarts). Set FIREBASE_PROJECT_ID for cloud sync.'}
            </p>

            <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/80">
              Rules: <code className="text-slate-300">firebase/firestore.rules</code>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Notification & Approval Preferences</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-400 font-medium block mb-1">
              Email Digest Recipient (Target for Outbound Summaries)
            </label>
            <input
              type="email"
              value={digestEmail}
              onChange={(e) => setDigestEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Pre-filled when the <code>prepare_notification</code> tool drafts an outbound digest.
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyOnApproval}
                onChange={(e) => setNotifyOnApproval(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 rounded"
              />
              <span className="text-slate-300">
                Alert on pending Human-in-the-Loop approval checkpoints
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyOnFailure}
                onChange={(e) => setNotifyOnFailure(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 rounded"
              />
              <span className="text-slate-300">
                Alert on unrecoverable transient step retries exceeded
              </span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSavePreferences}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-500/20"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* GitHub & University Project Information */}
      <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3 text-xs text-slate-400">
        <h3 className="text-sm font-semibold text-white">Repository & Capstone Details</h3>
        <p className="leading-relaxed">
          AgentFlow is an extensible final-year university capstone demonstrating multi-agent planning,
          modular tool isolation, and observable telemetry. The repository architecture strictly separates
          the frontend (React 19 + TypeScript) and the backend (FastAPI + Pydantic).
        </p>
        <div className="pt-2 flex flex-wrap gap-4 font-mono text-[11px] text-blue-400">
          <span>Author: Vivek Gaikwad</span>
          <span>·</span>
          <span>University: MIT-WPU</span>
          <span>·</span>
          <span>Version: 1.0.0</span>
        </div>
      </div>
    </div>
  );
};
