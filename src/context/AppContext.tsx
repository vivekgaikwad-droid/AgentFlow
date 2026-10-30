import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Workflow,
  WorkflowRun,
  TrackedCompany,
  JobPosting,
  ApprovalRequest,
  SystemStats,
  UserProfile,
} from '../types';
import * as api from '../services/api';
import {
  subscribeToAuthState,
  isFirebaseClientConfigured,
  logoutFirebase,
} from '../lib/firebase';

export type ActiveView =
  | 'landing'
  | 'dashboard'
  | 'builder'
  | 'execution'
  | 'jobs'
  | 'approvals'
  | 'history'
  | 'workflows'
  | 'settings'
  | 'auth';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedRunId: string | null;
  setSelectedRunId: (id: string | null) => void;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isAuthLoading: boolean;
  firebaseClientConfigured: boolean;
  stats: SystemStats | null;
  workflows: Workflow[];
  runs: WorkflowRun[];
  companies: TrackedCompany[];
  jobs: JobPosting[];
  approvals: ApprovalRequest[];
  isLoading: boolean;
  backendError: string | null;
  storageMode: string;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  refreshData: () => Promise<void>;
  triggerWorkflowRun: (workflowId: string) => Promise<WorkflowRun>;
  signOutUser: () => Promise<void>;
}

const defaultStats: SystemStats = {
  total_workflows: 0,
  successful_runs: 0,
  failed_runs: 0,
  pending_approvals: 0,
  tracked_companies: 0,
  new_jobs_discovered: 0,
  active_runs: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// Pages that do not require authentication
const PUBLIC_VIEWS: ActiveView[] = ['landing', 'auth'];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveViewState] = useState<ActiveView>('landing');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const firebaseConfigured = isFirebaseClientConfigured();

  // Restore cached user session for quick hydration while Firebase initializes
  const [user, setUserState] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('agentflow_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setUser = (newUser: UserProfile | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('agentflow_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('agentflow_user');
      api.setAuthToken(null);
    }
  };

  const [stats, setStats] = useState<SystemStats | null>(defaultStats);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [companies, setCompanies] = useState<TrackedCompany[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<string>('checking...');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Safe navigation with route protection
  const setActiveView = (view: ActiveView) => {
    if (!PUBLIC_VIEWS.includes(view) && !user && !isAuthLoading) {
      showToast('Authentication required. Please sign in to access protected features.', 'error');
      setActiveViewState('auth');
      return;
    }
    setActiveViewState(view);
  };

  // Sync with real Firebase Authentication state
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToAuthState((fbUser, token) => {
      if (!isMounted) return;
      if (fbUser) {
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          display_name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
          role: 'Platform Engineer',
          created_at: fbUser.metadata?.creationTime || new Date().toISOString(),
        };
        setUserState(profile);
        localStorage.setItem('agentflow_user', JSON.stringify(profile));
        if (token) {
          api.setAuthToken(token);
        }
      } else {
        // If Firebase is configured and user logged out, clear user state
        if (firebaseConfigured) {
          setUserState(null);
          localStorage.removeItem('agentflow_user');
          api.setAuthToken(null);
        }
      }
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [firebaseConfigured]);

  const signOutUser = async () => {
    try {
      await logoutFirebase();
      setUser(null);
      api.setAuthToken(null);
      showToast('Signed out of Firebase Authentication.', 'info');
      setActiveViewState('auth');
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to sign out', 'error');
    }
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setBackendError(null);

      // Verify backend health first
      const health = await api.fetchHealth().catch((e) => {
        setBackendError(e.message || 'Cannot reach backend service');
        return null;
      });

      if (health) {
        setStorageMode(health.storage_mode || 'local_development');
      }

      // If user is authenticated, fetch protected resources
      if (user || !firebaseConfigured) {
        const [s, w, r, c, j, a] = await Promise.all([
          api.fetchStats().catch(() => defaultStats),
          api.fetchWorkflows().catch(() => []),
          api.fetchRuns().catch(() => []),
          api.fetchCompanies().catch(() => []),
          api.fetchJobs().catch(() => []),
          api.fetchApprovals().catch(() => []),
        ]);

        setStats(s);
        setWorkflows(w);
        setRuns(r);
        setCompanies(c);
        setJobs(j);
        setApprovals(a);
      }
    } catch (err: unknown) {
      console.error('Data refresh error:', err);
      setBackendError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  const triggerWorkflowRun = async (workflowId: string): Promise<WorkflowRun> => {
    const newRun = await api.runWorkflow(workflowId);
    showToast(`Execution started for pipeline: ${newRun.workflow_name}`, 'success');
    setSelectedRunId(newRun.run_id);
    setActiveView('execution');
    await refreshData();
    return newRun;
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedRunId,
        setSelectedRunId,
        user,
        setUser,
        isAuthLoading,
        firebaseClientConfigured: firebaseConfigured,
        stats,
        workflows,
        runs,
        companies,
        jobs,
        approvals,
        isLoading,
        backendError,
        storageMode,
        toasts,
        showToast,
        dismissToast,
        refreshData,
        triggerWorkflowRun,
        signOutUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
