import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import {
  loginWithFirebase,
  registerWithFirebase,
  formatAuthError,
  getFirebaseConfig,
} from '../lib/firebase';
import * as api from '../services/api';

export const AuthPage: React.FC = () => {
  const { user, setUser, showToast, setActiveView, signOutUser } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fbConfig = getFirebaseConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (fbConfig.isConfigured) {
        if (mode === 'register') {
          const { user: fbUser, token } = await registerWithFirebase(email, password, displayName);
          api.setAuthToken(token);
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || email,
            display_name: displayName.trim() || fbUser.email?.split('@')[0] || 'User',
            role: 'Platform Engineer',
            created_at: new Date().toISOString(),
          });
          showToast(`Account created successfully as ${email}`, 'success');
        } else {
          const { user: fbUser, token } = await loginWithFirebase(email, password);
          api.setAuthToken(token);
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || email,
            display_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            role: 'Platform Engineer',
            created_at: new Date().toISOString(),
          });
          showToast(`Authenticated successfully as ${email}`, 'success');
        }
        setActiveView('dashboard');
      } else {
        // Fallback when VITE_FIREBASE_API_KEY is not yet supplied in the environment
        const devUid = `usr_${btoa(email.trim()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;
        const devToken = `dev_token_${devUid}`;
        api.setAuthToken(devToken);
        setUser({
          uid: devUid,
          email: email.trim(),
          display_name: displayName.trim() || email.split('@')[0],
          role: 'Platform Engineer (Dev Mode)',
          created_at: new Date().toISOString(),
        });
        showToast(
          `Signed in in local dev mode. (Set VITE_FIREBASE_API_KEY for live Firebase Auth)`,
          'info'
        );
        setActiveView('dashboard');
      }
    } catch (err: any) {
      console.error('Authentication failure:', err);
      const friendly = formatAuthError(err.code || err.message, err.message);
      setErrorMessage(friendly);
      showToast(friendly, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {user ? 'Account Management' : mode === 'login' ? 'Sign In to AgentFlow' : 'Create AgentFlow Account'}
          </h1>
          <p className="text-xs text-slate-400">
            {user
              ? `Currently authenticated as ${user.email}`
              : 'Firebase Authentication with backend-enforced RBAC'}
          </p>
        </div>

        {/* Firebase Project Badge */}
        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">Firebase Project ID</span>
              <span className="text-white font-mono font-medium">{fbConfig.projectId}</span>
            </div>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
              fbConfig.isConfigured
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {fbConfig.isConfigured ? 'Web SDK Active' : 'Dev Auth Mode'}
          </span>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {user ? (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                <span className="text-slate-400">Status:</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Display Name:</span>
                <span className="text-white font-bold">{user.display_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-blue-300">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="text-emerald-400 font-bold">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">User UID:</span>
                <span className="text-slate-400 truncate max-w-[200px]" title={user.uid}>
                  {user.uid}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('dashboard')}
                className="flex-1 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="py-2.5 px-4 text-xs font-semibold text-red-300 bg-red-950/40 hover:bg-red-900/40 border border-red-800/50 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'register' && (
              <div>
                <label className="text-slate-400 font-medium block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Prof. Vivek Gaikwad"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-slate-400 font-medium block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Minimum 6 characters required by Firebase Auth.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : mode === 'login' ? (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center border-t border-slate-800/80">
              {mode === 'login' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Don't have an account? <span className="text-blue-400 underline underline-offset-2">Register here</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Already have an account? <span className="text-blue-400 underline underline-offset-2">Sign in</span>
                </button>
              )}
            </div>
          </form>
        )}

        <div className="pt-4 border-t border-slate-800/60 text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Architecture & Security Note</span>
          </div>
          <p className="leading-relaxed">
            Client requests authenticate with Firebase ID tokens passed in the{' '}
            <code className="text-slate-300">Authorization: Bearer</code> header. The FastAPI backend verifies the
            token via Firebase Admin SDK, enforces resource ownership, and interacts with Cloud Firestore. Direct
            client access to Firestore is permanently denied by security rules.
          </p>
        </div>
      </div>
    </div>
  );
};
