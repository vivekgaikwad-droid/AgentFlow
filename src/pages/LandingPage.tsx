import React from 'react';
import { useApp } from '../context/AppContext';
import {
  GitBranch,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle,
  Clock,
  Sparkles,
  Terminal,
  Search,
  ExternalLink,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setActiveView } = useApp();

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-6xl mx-auto w-full text-center">
        {/* Subtitle kicker with unboxed text */}
        <div className="inline-flex items-center gap-2 text-xs text-blue-400 font-medium mb-4">
          <span>Final-Year Engineering Capstone</span>
          <span aria-hidden="true">·</span>
          <span>Autonomous Multi-Agent Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 max-w-3xl mx-auto leading-tight">
          From Prompts to Action.
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          AgentFlow translates natural-language objectives into verified, multi-step execution plans.
          Combining Google Gemini reasoning with a strictly controlled backend tool registry,
          persistent observation loops, and mandatory human-in-the-loop approvals.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button
            onClick={() => setActiveView('dashboard')}
            className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 whitespace-nowrap"
          >
            <span>Launch AgentFlow</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('how-it-works');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3 text-sm font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-all whitespace-nowrap"
          >
            Explore How It Works
          </button>
        </div>

        {/* Visual Pipeline Lifecycle Ribbon */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl text-left">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              The AgentFlow Autonomous Lifecycle
            </span>
            <span className="text-xs text-slate-500 font-mono">PLAN · ACT · OBSERVE · APPROVE</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-lg">
              <span className="text-slate-500 font-mono block text-[10px] mb-1">01. UNDERSTAND</span>
              <span className="font-semibold text-white block">Goal Ingestion</span>
              <span className="text-slate-400 text-[11px] mt-1 block">Parse user prompt</span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-lg">
              <span className="text-blue-400 font-mono block text-[10px] mb-1">02. PLAN</span>
              <span className="font-semibold text-white block">Gemini AI Planner</span>
              <span className="text-slate-400 text-[11px] mt-1 block">Structured step sequence</span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-lg">
              <span className="text-indigo-400 font-mono block text-[10px] mb-1">03. ACT</span>
              <span className="font-semibold text-white block">Tool Execution</span>
              <span className="text-slate-400 text-[11px] mt-1 block">Controlled registry</span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-lg">
              <span className="text-cyan-400 font-mono block text-[10px] mb-1">04. OBSERVE</span>
              <span className="font-semibold text-white block">State Telemetry</span>
              <span className="text-slate-400 text-[11px] mt-1 block">Verify tool outputs</span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-amber-500/30 rounded-lg bg-amber-950/10">
              <span className="text-amber-400 font-mono block text-[10px] mb-1">05. APPROVE</span>
              <span className="font-semibold text-amber-300 block">Human Checkpoint</span>
              <span className="text-slate-400 text-[11px] mt-1 block">Pre-dispatch review</span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-emerald-500/30 rounded-lg bg-emerald-950/10">
              <span className="text-emerald-400 font-mono block text-[10px] mb-1">06. COMPLETE</span>
              <span className="font-semibold text-emerald-300 block">Execution Report</span>
              <span className="text-slate-400 text-[11px] mt-1 block">Audit log & metrics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Demonstration: Job Tracker Showcase */}
      <section className="py-16 px-6 bg-slate-950/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block mb-2">
              Primary Capstone Demonstration
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Automated Job & Internship Tracker
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Monitors public careers portals (Google Cloud, Datadog, HashiCorp, Cloudflare) for Cloud Engineering
              and DevOps roles. Employs fingerprint hashing to detect real new postings while preventing duplicate inserts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col justify-between">
              <div>
                <Search className="w-5 h-5 text-blue-400 mb-3" />
                <h3 className="text-base font-semibold text-white mb-2">Targeted Web Scanning</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Checks configured public portals complying with rate limits and robots rules. Extracts job titles,
                  locations, experience requirements, and original posting URLs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                Tool: web_check
              </div>
            </div>

            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col justify-between">
              <div>
                <Layers className="w-5 h-5 text-indigo-400 mb-3" />
                <h3 className="text-base font-semibold text-white mb-2">Fingerprint Deduplication</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Normalizes source URLs and generates composite hashes to distinguish brand new listings from
                  previously recorded database records.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                Tool: compare_jobs
              </div>
            </div>

            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col justify-between">
              <div>
                <ShieldCheck className="w-5 h-5 text-amber-400 mb-3" />
                <h3 className="text-base font-semibold text-white mb-2">Human Authorization Gate</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Summarizes freshly discovered opportunities into an email digest. Pauses pipeline execution
                  until the user explicitly approves or rejects delivery.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                Tool: prepare_notification
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / Core Architecture */}
      <section id="how-it-works" className="py-16 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block mb-2">
            Engineering Rigor
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Architectural Safeguards & Invariants
          </h2>
          <p className="text-slate-400 text-sm">
            AgentFlow ensures that AI reasoning remains strictly bounded by backend security boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-semibold text-white">Controlled Tool Allowlist</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              The AI never receives arbitrary code execution capabilities, filesystem shell access, or unrestricted network reach.
              Every action must correspond to a predefined Python tool in the backend registry with typed Pydantic input schemas.
            </p>
            <div className="text-[11px] text-slate-500 font-mono bg-slate-950 p-2.5 rounded border border-slate-800/60">
              Valid tools: web_check · compare_jobs · save_jobs · prepare_notification · complete_workflow
            </div>
          </div>

          <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-white">Zero Secret Leakage</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              All Gemini API operations, Firebase Admin credentials, and database mutations are strictly encapsulated on the server.
              Frontend bundles never touch API secrets, and sensitive tokens are masked in logs.
            </p>
            <div className="text-[11px] text-slate-500 font-mono bg-slate-950 p-2.5 rounded border border-slate-800/60">
              Security: Server-side proxy · Firebase ownership rules · Redacted telemetry logs
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-6 border-t border-slate-800/80 bg-slate-950 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-300">AgentFlow</span>
            <span>· MIT-WPU University Final Year Capstone Project</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveView('dashboard')}
              className="hover:text-white transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className="hover:text-white transition-colors"
            >
              System Status
            </button>
            <span className="font-mono text-slate-400">2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
