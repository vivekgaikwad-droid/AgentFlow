import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { NotificationToast } from './components/NotificationToast';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkflowBuilderPage } from './pages/WorkflowBuilderPage';
import { ExecutionViewPage } from './pages/ExecutionViewPage';
import { JobTrackerPage } from './pages/JobTrackerPage';
import { ApprovalCenterPage } from './pages/ApprovalCenterPage';
import { ExecutionHistoryPage } from './pages/ExecutionHistoryPage';
import { WorkflowManagementPage } from './pages/WorkflowManagementPage';
import { AuthPage } from './pages/AuthPage';
import { SettingsPage } from './pages/SettingsPage';
import { Menu, ShieldAlert, ArrowRight } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeView, setActiveView, user, isAuthLoading } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Landing page renders without sidebar for clean marketing presence
  if (activeView === 'landing') {
    return (
      <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
        <Navbar />
        <LandingPage />
        <NotificationToast />
      </div>
    );
  }

  const isProtectedView = activeView !== 'auth';

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#0B101D] flex flex-col min-h-screen">
          {/* Mobile subheader with sidebar toggle */}
          <div className="lg:hidden p-3 border-b border-slate-800 bg-[#090D16] flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-md bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </button>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              {activeView}
            </span>
          </div>

          <div className="flex-1 pb-16">
            {/* Page Access Gate: If protected view and user not authenticated */}
            {isProtectedView && !user && !isAuthLoading ? (
              <div className="min-h-[70vh] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-slate-900/70 border border-slate-800 rounded-xl p-8 text-center space-y-5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-white tracking-tight">Authentication Required</h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      You must be signed in with Firebase Authentication to access the <span className="font-mono text-slate-200">{activeView}</span> module and user-owned resources.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('auth')}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20"
                  >
                    <span>Sign In or Register</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {activeView === 'dashboard' && <DashboardPage />}
                {activeView === 'builder' && <WorkflowBuilderPage />}
                {activeView === 'execution' && <ExecutionViewPage />}
                {activeView === 'jobs' && <JobTrackerPage />}
                {activeView === 'approvals' && <ApprovalCenterPage />}
                {activeView === 'history' && <ExecutionHistoryPage />}
                {activeView === 'workflows' && <WorkflowManagementPage />}
                {activeView === 'auth' && <AuthPage />}
                {activeView === 'settings' && <SettingsPage />}
              </>
            )}
          </div>
        </main>
      </div>

      <NotificationToast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
