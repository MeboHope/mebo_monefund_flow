import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { CheckCircle2, LockKeyhole, Mail, Shield, Smartphone } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

type AuthMode = 'signin' | 'signup' | 'reset';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  localMode: boolean;
  isConfigured: boolean;
  enableLocalMode: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const requireSupabaseAuth = import.meta.env.VITE_REQUIRE_SUPABASE_AUTH === 'true';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [localMode, setLocalMode] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    localMode,
    isConfigured: isSupabaseConfigured,
    enableLocalMode: () => setLocalMode(true),
    signOut: async () => {
      if (supabase) await supabase.auth.signOut();
      setSession(null);
      setLocalMode(false);
    }
  }), [session, loading, localMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, user, localMode, isConfigured, enableLocalMode } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [continueLocally, setContinueLocally] = useState(localMode);

  if (loading) {
    return (
      <main className="auth-page">
        <section className="auth-card auth-card--narrow">
          <img src="/brand/pesaweave-icon.svg" alt="PesaWeave" />
          <h1>Securing your workspace</h1>
          <p>Checking authentication and tenant access.</p>
        </section>
      </main>
    );
  }

  if (user || continueLocally) return <>{children}</>;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (!supabase) {
      setError('Supabase is not configured yet. Add your Supabase URL and anon key to the environment to enable real authentication.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        setMessage('Signed in successfully.');
      }

      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name || email.split('@')[0]
            }
          }
        });
        if (signUpError) throw signUpError;
        setMessage('Account created. Check your email to verify your account before signing in.');
      }

      if (mode === 'reset') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (resetError) throw resetError;
        setMessage('Password reset email sent.');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <article className="auth-brand-panel">
          <img src="/brand/pesaweave-primary.svg" alt="PesaWeave" />
          <h1>Secure access for every money flow.</h1>
          <p>Sign in to an isolated tenant workspace. Every financial record is protected by authentication, role-based access and tenant-aware database policies.</p>
          <div className="auth-security-grid">
            <span><Shield size={17} /> Tenant isolation</span>
            <span><LockKeyhole size={17} /> Row-level security ready</span>
            <span><Mail size={17} /> Email verification</span>
            <span><Smartphone size={17} /> M-Pesa secrets stay server-side</span>
          </div>
        </article>

        <article className="auth-card">
          <div>
            <p className="eyebrow">Protected workspace</p>
            <h2>{mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}</h2>
            <p>{isConfigured ? 'Use your PesaWeave account to continue.' : 'Connect Supabase to enable hosted authentication.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <label>Full name
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" />
              </label>
            )}
            <label>Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" autoComplete="email" required />
            </label>
            {mode !== 'reset' && (
              <label>Password
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Minimum 8 characters" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required minLength={8} />
              </label>
            )}
            {error && <div className="form-message form-message--error">{error}</div>}
            {message && <div className="form-message form-message--success">{message}</div>}
            <button className="btn btn--primary btn--large" type="submit" disabled={submitting || !isConfigured}>
              {submitting ? 'Please wait' : mode === 'signin' ? 'Sign in securely' : mode === 'signup' ? 'Create secure account' : 'Send reset email'}
            </button>
          </form>

          <div className="auth-switcher">
            {mode !== 'signin' && <button type="button" onClick={() => setMode('signin')}>Back to sign in</button>}
            {mode !== 'signup' && <button type="button" onClick={() => setMode('signup')}>Create an account</button>}
            {mode !== 'reset' && <button type="button" onClick={() => setMode('reset')}>Forgot password</button>}
          </div>

          {!isConfigured && !requireSupabaseAuth && (
            <div className="local-mode-box">
              <strong>Development setup mode</strong>
              <span>Add Supabase environment variables for hosted authentication. You can continue locally to test UI flows only.</span>
              <button type="button" className="btn btn--secondary" onClick={() => { enableLocalMode(); setContinueLocally(true); }}><CheckCircle2 size={16} /> Continue locally</button>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
