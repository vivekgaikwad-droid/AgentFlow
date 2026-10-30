import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TrackedCompany, JobPosting } from '../types';
import * as api from '../services/api';
import {
  Briefcase,
  Search,
  Plus,
  Play,
  ExternalLink,
  Bookmark,
  Check,
  Trash2,
  Edit3,
  RefreshCw,
  Globe,
  SlidersHorizontal,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const JobTrackerPage: React.FC = () => {
  const { companies, jobs, showToast, refreshData } = useApp();

  const [activeTab, setActiveTab] = useState<'jobs' | 'companies'>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Add Company Modal State
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<TrackedCompany | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [companyKeywords, setCompanyKeywords] = useState('Cloud, DevOps, Intern');
  const [companyLocations, setCompanyLocations] = useState('Remote, US');
  const [companyLevel, setCompanyLevel] = useState('Internship');
  const [isSubmittingCompany, setIsSubmittingCompany] = useState(false);
  const [checkingCompanyId, setCheckingCompanyId] = useState<string | null>(null);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany =
      selectedCompanyFilter === 'all' || job.company_id === selectedCompanyFilter;

    const matchesStatus =
      selectedStatusFilter === 'all' || job.application_status === selectedStatusFilter;

    return matchesSearch && matchesCompany && matchesStatus;
  });

  const handleManualCheck = async (companyId: string) => {
    try {
      setCheckingCompanyId(companyId);
      const res = await api.checkCompanyNow(companyId);
      showToast(
        `Scanned ${res.company}: ${res.new_jobs_found} new postings found.`,
        'success'
      );
      await refreshData();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to check company', 'error');
    } finally {
      setCheckingCompanyId(null);
    }
  };

  const handleUpdateJobStatus = async (jobId: string, status: 'discovered' | 'saved' | 'applied' | 'archived') => {
    try {
      await api.updateJobStatus(jobId, status);
      showToast(`Updated posting status to ${status}`, 'success');
      await refreshData();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to update job', 'error');
    }
  };

  const openAddModal = () => {
    setEditingCompany(null);
    setCompanyName('');
    setCompanyUrl('');
    setCompanyKeywords('Cloud, DevOps, Intern');
    setCompanyLocations('Remote, US');
    setCompanyLevel('Internship');
    setShowAddCompanyModal(true);
  };

  const openEditModal = (comp: TrackedCompany) => {
    setEditingCompany(comp);
    setCompanyName(comp.name);
    setCompanyUrl(comp.careers_url);
    setCompanyKeywords(comp.keywords.join(', '));
    setCompanyLocations(comp.locations.join(', '));
    setCompanyLevel(comp.experience_level || 'All Levels');
    setShowAddCompanyModal(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !companyUrl.trim()) {
      showToast('Company name and careers URL are required', 'error');
      return;
    }

    // Client-side SSRF validation warning
    const lower = companyUrl.toLowerCase();
    if (lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('169.254')) {
      showToast('Target URL rejected: internal or loopback addresses are prohibited (SSRF Protection)', 'error');
      return;
    }

    try {
      setIsSubmittingCompany(true);
      const payload = {
        name: companyName.trim(),
        careers_url: companyUrl.trim(),
        keywords: companyKeywords.split(',').map((s) => s.trim()).filter(Boolean),
        locations: companyLocations.split(',').map((s) => s.trim()).filter(Boolean),
        experience_level: companyLevel,
        enabled: true,
      };

      if (editingCompany) {
        await api.updateCompany(editingCompany.id, payload);
        showToast(`Updated ${companyName}!`, 'success');
      } else {
        await api.addCompany(payload);
        showToast(`Added ${companyName} to monitoring list!`, 'success');
      }

      setShowAddCompanyModal(false);
      await refreshData();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to save company', 'error');
    } finally {
      setIsSubmittingCompany(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`Stop monitoring ${companyName}?`)) return;
    try {
      await api.deleteCompany(companyId);
      showToast(`Removed ${companyName}`, 'info');
      await refreshData();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to delete company', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Job-Posting Tracker</h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated career portal monitoring, deduplication fingerprinting, and application queue.
          </p>
        </div>

        {/* Tab Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'jobs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Discovered Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'companies'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tracked Companies ({companies.length})
          </button>
        </div>
      </div>

      {activeTab === 'jobs' ? (
        /* Jobs Tab */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[240px] flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by title, company, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Company Filter */}
              <select
                value={selectedCompanyFilter}
                onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="discovered">Discovered</option>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="text-xs text-slate-400 font-mono tabular-nums">
              Showing {filteredJobs.length} of {jobs.length} postings
            </div>
          </div>

          {/* Jobs Table */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
            {filteredJobs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No matching postings found. Adjust your search or trigger a company scan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Position & Company</th>
                      <th className="px-4 py-3 font-semibold">Location</th>
                      <th className="px-4 py-3 font-semibold">Experience</th>
                      <th className="px-4 py-3 font-semibold">Discovered</th>
                      <th className="px-4 py-3 font-semibold">Application Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">
                              {job.title}
                            </span>
                            {job.is_new ? (
                              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                                [NEW]
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {job.company_name}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-300">
                          {job.location}
                        </td>

                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {job.experience_level || 'All Levels'}
                        </td>

                        <td className="px-4 py-3 text-slate-400 font-mono tabular-nums text-[11px] whitespace-nowrap">
                          {new Date(job.first_seen_at).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={job.application_status}
                            onChange={(e) =>
                              handleUpdateJobStatus(
                                job.id,
                                e.target.value as 'discovered' | 'saved' | 'applied' | 'archived'
                              )
                            }
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                          >
                            <option value="discovered">Discovered</option>
                            <option value="saved">Saved</option>
                            <option value="applied">Applied</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <a
                            href={job.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800/40 rounded transition-colors"
                          >
                            <span>Open Posting</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Companies Tab */
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openAddModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Tracked Company</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((comp) => (
              <div
                key={comp.id}
                className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-white">{comp.name}</h3>
                      <a
                        href={comp.careers_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-0.5 truncate max-w-sm"
                      >
                        <Globe className="w-3 h-3 shrink-0" />
                        <span className="truncate">{comp.careers_url}</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(comp)}
                        className="p-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
                        title="Edit Company Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleManualCheck(comp.id)}
                        disabled={checkingCompanyId === comp.id}
                        className="p-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
                        title="Scan Careers Portal Now"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            checkingCompanyId === comp.id ? 'animate-spin text-blue-400' : ''
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(comp.id, comp.name)}
                        className="p-2 text-xs text-slate-400 hover:text-red-400 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-colors"
                        title="Remove Company"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-slate-400">
                      <span className="text-slate-500">Keywords:</span>{' '}
                      <span className="text-slate-300">{comp.keywords.join(', ')}</span>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-500">Locations:</span>{' '}
                      <span className="text-slate-300">{comp.locations.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>
                    Last Checked:{' '}
                    {comp.last_checked_at
                      ? new Date(comp.last_checked_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </span>
                  <span className="text-slate-300 font-semibold tabular-nums">
                    {comp.jobs_count} postings
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Company Modal */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingCompany ? 'Edit Company Monitor' : 'Add Company Careers Portal'}
            </h3>

            <form onSubmit={handleSaveCompany} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe, AWS, Datadog"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Public Careers URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://company.com/careers"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Must be public HTTP/HTTPS. Localhost and private subnet addresses are blocked.
                </span>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Target Keywords (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Cloud, DevOps, SRE, Platform"
                  value={companyKeywords}
                  onChange={(e) => setCompanyKeywords(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Target Locations</label>
                <input
                  type="text"
                  placeholder="Remote, Bengaluru, Seattle"
                  value={companyLocations}
                  onChange={(e) => setCompanyLocations(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Experience Level</label>
                <select
                  value={companyLevel}
                  onChange={(e) => setCompanyLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Internship">Internship / Student</option>
                  <option value="Entry Level">Entry Level / Junior</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior Level">Senior Level</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCompany}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-500/20"
                >
                  {isSubmittingCompany ? 'Saving...' : editingCompany ? 'Save Changes' : 'Add Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
