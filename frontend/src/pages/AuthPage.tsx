import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, KeyRound, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Card } from '../components/ui/Primitives';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        toast({ title: 'Signed in to TechPulse', variant: 'success' });
        navigate('/');
      } else if (mode === 'signup') {
        const res = await signUp(email, password, displayName || email.split('@')[0]);
        if (res.needsConfirmation) {
          toast({
            title: 'Check your email',
            description: 'Confirm your email address from Supabase to complete signup.',
            variant: 'info',
          });
          setMode('login');
        } else {
          toast({ title: 'Account created', variant: 'success' });
          navigate('/');
        }
      } else {
        await resetPassword(email);
        toast({
          title: 'Password reset sent',
          description: 'Check your inbox for a password reset link.',
          variant: 'success',
        });
        setMode('login');
      }
    } catch (err) {
      toast({ title: 'Authentication error', description: (err as Error).message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#09090b] p-4">
      <Card className="w-full max-w-md p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-500">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">TechPulse</h1>
            <p className="text-xs text-zinc-500">Personal Tech Intelligence & Productivity</p>
          </div>
        </div>

        <div className="flex gap-1 rounded-lg bg-zinc-100 dark:bg-[#17171c] p-1 text-xs">
          {(['login', 'signup', 'reset'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab)}
              className={`flex-1 rounded-md py-1.5 font-medium capitalize transition-colors ${
                mode === tab
                  ? 'bg-white dark:bg-[#23232b] text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {tab === 'login' ? 'Sign In' : tab === 'signup' ? 'Create Account' : 'Reset'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium mb-1">Display Name</label>
              <div className="relative">
                <User className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] pl-9 pr-3 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <div className="relative">
              <Mail className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] pl-9 pr-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-xs font-medium mb-1">Password</label>
              <div className="relative">
                <KeyRound className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] pl-9 pr-3 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full h-10" disabled={busy}>
            {busy
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : mode === 'signup'
              ? 'Create Account'
              : 'Send Reset Link'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
