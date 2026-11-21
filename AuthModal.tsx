import React, { useState } from 'react';
import { Lock, Mail, User, X } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import {
  loginDemoEmail,
  signupDemoEmail,
  syncFirebaseUserProfile,
  UserProfile,
} from '../services/dataStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && name.trim().length < 2) {
      setError('Please enter your full name to create an account.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      const profile =
        mode === 'login'
          ? loginDemoEmail(email, password)
          : signupDemoEmail(name, email, password);
      onAuthSuccess(profile);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const profile = await syncFirebaseUserProfile(fbUser.uid, {
        name: fbUser.displayName || 'Highland Explorer',
        email: fbUser.email || '',
        avatar: fbUser.photoURL || '',
      });
      onAuthSuccess(profile);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In cancelled.';
      if (msg.includes('popup-blocked') || msg.includes('popup-closed')) {
        setError('Google popup was closed or blocked. You can also test instantly with test@highland.com / 123456.');
      } else {
        setError('Could not complete Google Sign-In. You can use test@highland.com / 123456 for instant access.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoAccount = () => {
    setMode('login');
    setEmail('test@highland.com');
    setPassword('123456');
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-ink/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md bg-cream rounded-3xl border border-oak pinterest-shadow p-6 sm:p-8 space-y-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-sand border border-oak flex items-center justify-center text-slate-ink hover:border-coral transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1 pr-8">
          <p className="text-xs font-bold text-lake-deep">Highland Sanctuary Account</p>
          <h2 id="auth-modal-title" className="text-2xl font-bold text-slate-ink">
            {mode === 'login' ? 'Welcome back, traveler' : 'Create your sanctuary profile'}
          </h2>
          <p className="text-xs text-slate-muted">
            Save favorite sanctuaries across all 8 states and sync your trail bookings.
          </p>
        </div>

        {/* Google Sign-In CTA (Flamingo Coral #FF8E8B) */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-5 rounded-full bg-coral hover:bg-coral-soft text-slate-ink text-sm font-bold flex items-center justify-center gap-2.5 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#2C3E50"
              d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
            />
          </svg>
          <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-oak" />
          <span className="text-xs font-semibold text-slate-subtle">or with email</span>
          <div className="flex-1 h-px bg-oak" />
        </div>

        {/* Mode Switcher: Login / Sign Up */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-sand rounded-full border border-oak">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-lake text-white shadow-sm'
                : 'text-slate-muted hover:text-slate-ink'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'bg-lake text-white shadow-sm'
                : 'text-slate-muted hover:text-slate-ink'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-bold text-slate-ink mb-1">
                Full Name
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-sand border border-oak focus-within:border-lake focus-within:bg-white">
                <User className="w-4 h-4 text-lake shrink-0" />
                <input
                  id="auth-name"
                  type="text"
                  placeholder="e.g., Priya Hazarika"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-ink focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-bold text-slate-ink mb-1">
              Email Address
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-sand border border-oak focus-within:border-lake focus-within:bg-white">
              <Mail className="w-4 h-4 text-lake shrink-0" />
              <input
                id="auth-email"
                type="email"
                placeholder="test@highland.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-ink focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-bold text-slate-ink mb-1">
              Password
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-sand border border-oak focus-within:border-lake focus-within:bg-white">
              <Lock className="w-4 h-4 text-lake shrink-0" />
              <input
                id="auth-password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-ink focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 px-5 rounded-full bg-lake hover:bg-lake-deep text-white text-sm font-bold transition-colors cursor-pointer"
          >
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        {/* Instant Demo Credential Helpers */}
        <div className="pt-2 border-t border-oak flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-muted">
            Demo: <strong className="text-slate-ink">test@highland.com</strong> /{' '}
            <strong className="text-slate-ink tabular-nums">123456</strong>
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUseDemoAccount}
              className="font-bold text-lake-deep hover:text-slate-ink underline underline-offset-4 cursor-pointer"
            >
              Fill User
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setEmail('admin@highland.com');
                setPassword('admin123');
                setError(null);
              }}
              className="font-bold text-slate-ink hover:text-lake-deep underline underline-offset-4 cursor-pointer"
            >
              Fill Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
