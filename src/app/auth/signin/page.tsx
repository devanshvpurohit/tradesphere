'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/components/AuthContext';
import {
  TrendingUp,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Zap,
} from 'lucide-react';

export default function SignIn() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, signInDemo } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signInWithEmail(email, password);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setError(res.error || 'Failed to sign in. Please verify your credentials.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        router.push('/dashboard');
      } else if (res.error) {
        setError(res.error);
      }
    } catch {
      setError('Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setDemoLoading(true);
    try {
      await signInDemo();
      router.push('/dashboard');
    } catch {
      setError('Failed to initialize demo account.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Blobs */}
      <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] opacity-20 bg-blue-600 pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] opacity-15 bg-emerald-500 pointer-events-none" />

      <main className="w-full max-w-md z-10">
        <div className="bg-[#0e1626]/90 border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <Link href="/" className="flex items-center gap-2.5 mb-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                <div className="w-full h-full bg-[#0a0e17] rounded-[9px] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Trade<span className="text-blue-500">Sphere</span>
              </span>
            </Link>
            <h1 className="text-xl font-bold text-white tracking-tight">Institutional Terminal Login</h1>
            <p className="text-xs text-slate-400 mt-1">
              Sign in with Firebase Auth or try Instant Demo Trading
            </p>
          </div>

          {/* Quick Demo Trader Access Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={demoLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span>{demoLoading ? 'Starting Terminal...' : 'Instant Demo Trader (Preloaded ₹1,00,000)'}</span>
            </button>
            <div className="text-center mt-1.5">
              <span className="text-[10px] text-slate-400 font-mono">No signup needed • Instant paper trading</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] font-mono text-slate-400 uppercase">Or Continue With</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-2 mb-6"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Account</span>
          </button>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Work / Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@tradesphere.app"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 font-bold">
              Create an account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
