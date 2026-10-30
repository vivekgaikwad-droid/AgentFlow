import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WorkflowStep } from '../types';
import * as api from '../services/api';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

export const WorkflowBuilderPage: React.FC = () => {
  const { showToast, setActiveView, refreshData, triggerWorkflowRun } = useApp();

  const [goal, setGoal] = useState(
    'Monitor the careers pages of selected companies, identify newly published cloud engineering and DevOps internships, save new listings, and prepare an email notification.'
  );
  const [workflowName, setWorkflowName] = useState('Cloud & DevOps Internship Tracker');
  const [targetCompanies, setTargetCompanies] = useState('Google Cloud, Datadog, HashiCorp');
  const [keywords, setKeywords] = useState('Cloud Engineer, DevOps, Kubernetes, SRE');
  const [locationPref, setLocationPref] = useState('Remote, United States, India');
  const [experienceLevel, setExperienceLevel] = useState('Internship / Student');
  const [scheduleCron, setScheduleCron] = useState('0 8 * * 1-5');

  const [isPlanning, setIsPlanning] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [planSource, setPlanSource] = useState<string>('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const examplePrompts = [
    'Monitor selected company careers pages for new DevOps jobs.',
    'Find new cloud engineering internship listings and save them.',
    'Check a set of public webpages and report changes.',
    'Compare newly discovered job postings with previously tracked results.',
  ];

  const handleGeneratePlan = async () => {
    if (!goal.trim()) {
      showToast('Please specify an automation goal.', 'error');
      return;
    }

    try {
      setIsPlanning(true);
      const res = await api.planWorkflow(goal, {
        name: workflowName,
        companies: targetCompanies.split(',').map((s) => s.trim()),
        keywords: keywords.split(',').map((s) => s.trim()),
        location: locationPref,
        experience_level: experienceLevel,
      });

      if (res.plan) {
        if (res.plan.workflow_name) setWorkflowName(res.plan.workflow_name);
        setSteps(res.plan.steps || []);
        setPlanSource(res.source || 'gemini-3.8-flash');
        setPlanGenerated(true);
        showToast('Autonomous plan generated and validated successfully!', 'success');
      }
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to generate plan', 'error');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleStepChange = (index: number, field: keyof WorkflowStep, value: unknown) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddStep = () => {
    const newId = `step_${steps.length + 1}`;
    setSteps((prev) => [
      ...prev,
      {
        id: newId,
        name: 'New Custom Task Step',
        tool: 'record_observation',
        description: 'Validate custom invariant and log status',
        requires_approval: false,
        depends_on: steps.length > 0 ? [steps[steps.length - 1].id] : [],
      },
    ]);
  };

  const handleSaveWorkflow = async (andRunImmediately = false) => {
    if (!workflowName.trim()) {
      showToast('Please provide a workflow name.', 'error');
      return;
    }
    if (steps.length === 0) {
      showToast('Workflow must contain at least one step.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const created = await api.createWorkflow({
        name: workflowName,
        goal,
        steps,
        schedule_cron: scheduleCron || undefined,
      });

      showToast(`Workflow "${created.name}" saved!`, 'success');
      await refreshData();

      if (andRunImmediately) {
        await triggerWorkflowRun(created.id);
      } else {
        setActiveView('workflows');
      }
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to save workflow', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Workflow Builder</h1>
        <p className="text-xs text-slate-400 mt-1">
          Specify your automation goal in plain language. Google Gemini synthesizes an executable multi-step sequence mapped to the backend tool registry.
        </p>
      </div>

      {/* Goal Input Card */}
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl space-y-4">
        <label className="text-sm font-semibold text-white block">
          What would you like AgentFlow to accomplish?
        </label>
        <textarea
          rows={3}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. Monitor target careers pages, identify new Cloud and DevOps internships, deduplicate, and prepare notification..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
        />

        {/* Quick Example Prompts */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Suggested Prompts:
          </span>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setGoal(p)}
                className="text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 px-2.5 py-1.5 rounded-md transition-colors text-left"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Parameters Accordion */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 font-medium block mb-1">Workflow Name</label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Target Companies</label>
            <input
              type="text"
              value={targetCompanies}
              onChange={(e) => setTargetCompanies(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Keywords</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Location Preference</label>
            <input
              type="text"
              value={locationPref}
              onChange={(e) => setLocationPref(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Experience Level</label>
            <input
              type="text"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Schedule (Cron)</label>
            <input
              type="text"
              value={scheduleCron}
              onChange={(e) => setScheduleCron(e.target.value)}
              placeholder="e.g. 0 8 * * 1-5"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Generate Plan Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGeneratePlan}
            disabled={isPlanning}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-sm shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isPlanning ? 'animate-spin' : ''}`} />
            <span>{isPlanning ? 'Reasoning with Gemini...' : 'Generate Structured Plan'}</span>
          </button>
        </div>
      </div>

      {/* Generated Plan Section */}
      {planGenerated && (
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Generated Execution Pipeline</h2>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  Validated ({planSource})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review and customize steps before committing to persistent storage.
              </p>
            </div>

            <button
              onClick={handleAddStep}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Step</span>
            </button>
          </div>

          {/* Editable Steps List */}
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div
                key={step.id || idx}
                className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-6 h-6 rounded bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center font-bold mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => handleStepChange(idx, 'name', e.target.value)}
                        className="text-sm font-semibold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none px-1"
                      />
                      <span className="text-xs font-mono text-blue-400">
                        [{step.tool}]
                      </span>
                    </div>

                    <input
                      type="text"
                      value={step.description}
                      onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                      className="text-xs text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none w-full px-1"
                    />

                    {step.depends_on && step.depends_on.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Depends on: {step.depends_on.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Step Controls */}
                <div className="flex items-center gap-4 text-xs shrink-0 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  {/* Approval requirement toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={step.requires_approval}
                      onChange={(e) => handleStepChange(idx, 'requires_approval', e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
                    />
                    <span
                      className={`text-[11px] font-medium ${
                        step.requires_approval ? 'text-amber-400 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {step.requires_approval ? 'Human Approval Gate' : 'Automatic'}
                    </span>
                  </label>

                  <button
                    onClick={() => handleRemoveStep(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                    title="Remove step"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Confirmation Bar */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              {steps.filter((s) => s.requires_approval).length} step(s) require human authorization before dispatch.
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSaveWorkflow(false)}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                Save Workflow
              </button>
              <button
                onClick={() => handleSaveWorkflow(true)}
                disabled={isSaving}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Save & Run Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
