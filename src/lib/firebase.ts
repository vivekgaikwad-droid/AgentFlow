import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';

/**
 * Firebase Client Configuration for AgentFlow.
 * Connected to Firebase Project: agentflow-7dc3c
 *
 * NOTE: Only public web credentials belong in VITE_ environment variables.
 * Private keys, service accounts, and Gemini API keys are NEVER exposed here.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'agentflow-7dc3c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'agentflow-7dc3c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'agentflow-7dc3c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function isFirebaseClientConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 0);
}

export function getFirebaseConfig() {
  return {
    ...firebaseConfig,
    isConfigured: isFirebaseClientConfigured(),
  };
}

try {
  if (firebaseConfig.apiKey) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
  }
} catch (err) {
  console.warn('Firebase client initialization warning:', err);
}

export { auth };

/**
 * Maps Firebase Auth error codes to user-friendly diagnostic messages.
 */
export function formatAuthError(errorCode: string, defaultMessage?: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'The email address provided is not a valid email format.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/user-disabled':
      return 'This user account has been disabled by an administrator.';
    case 'auth/user-not-found':
      return 'No account was found with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network communication error. Please check your internet connection.';
    default:
      return defaultMessage || errorCode || 'An unexpected authentication error occurred.';
  }
}

/**
 * Register a new user with Firebase Authentication.
 */
export async function registerWithFirebase(
  email: string,
  pass: string,
  displayName: string
): Promise<{ user: FirebaseUser; token: string }> {
  if (!auth) {
    throw new Error(
      'Firebase Auth is not configured. Please supply VITE_FIREBASE_API_KEY in your environment.'
    );
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName.trim()) {
    await updateProfile(userCredential.user, {
      displayName: displayName.trim(),
    });
  }
  const token = await userCredential.user.getIdToken(true);
  return { user: userCredential.user, token };
}

/**
 * Sign in existing user with Firebase Authentication.
 */
export async function loginWithFirebase(
  email: string,
  pass: string
): Promise<{ user: FirebaseUser; token: string }> {
  if (!auth) {
    throw new Error(
      'Firebase Auth is not configured. Please supply VITE_FIREBASE_API_KEY in your environment.'
    );
  }

  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const token = await userCredential.user.getIdToken();
  return { user: userCredential.user, token };
}

/**
 * Sign out current user.
 */
export async function logoutFirebase(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Get current ID token or refresh it if close to expiration.
 */
export async function getIdToken(): Promise<string | null> {
  if (!auth || !auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

/**
 * Subscribe to Firebase Auth state changes.
 */
export function subscribeToAuthState(
  callback: (user: FirebaseUser | null, token: string | null) => void
): () => void {
  if (!auth) {
    callback(null, null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        const token = await fbUser.getIdToken();
        callback(fbUser, token);
      } catch (err) {
        console.error('Failed to obtain ID token:', err);
        callback(fbUser, null);
      }
    } else {
      callback(null, null);
    }
  });
}
