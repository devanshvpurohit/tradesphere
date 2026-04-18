'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Aesthetic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 bg-blue-900"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 bg-green-600"></div>

      {/* Login Container */}
      <main className="w-full max-w-[480px] z-10">
        <div className="bg-white rounded-lg p-10 md:p-14 shadow-2xl border border-gray-100">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="mb-4">
              <span className="text-xl font-black tracking-tighter text-gray-900">TradeSphere</span>
            </div>
            <h1 className="text-gray-900 text-2xl font-bold tracking-tight mb-2">Welcome Back</h1>
            <p className="text-gray-600 text-sm text-center">
              Institutional grade security for your Indian stock trading portfolio.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-[0.05em] text-gray-600 ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 rounded-md border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-600 transition-all text-gray-900 placeholder-gray-400"
                  id="email"
                  name="email"
                  placeholder="name@institution.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-xs font-medium uppercase tracking-[0.05em] text-gray-600" htmlFor="password">
                  Password
                </label>
                <Link href="#" className="text-[10px] uppercase tracking-wider font-bold text-gray-700 hover:text-blue-600 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 rounded-md border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-600 transition-all text-gray-900 placeholder-gray-400"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Login CTA */}
            <div className="pt-2">
              <button
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-full font-semibold text-sm tracking-tight shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                <span>{loading ? 'Accessing...' : 'Access Terminal'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[1px] bg-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="px-4 bg-white text-gray-500">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button
              onClick={() => {
                const supabase = createClient();
                supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } });
              }}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-gray-900 font-medium text-sm"
              type="button"
            >
              <img
                alt="Google"
                className="w-5 h-5"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2w2y9ja8rs830GIEYNFizy8caJTOmaE1aL0mEEVcS36a0vxjcMyJu1TetEsz8X8D62IDXmInt7tUpensxZq9pd1_Vnh-fUvkUPmLppNa726DppTxbQ9YB6Csov5lnVbWNxT6L9i5UnMa752QdXRa7_GsNLWB65ti1aK50W8x2Cyrli6mDG9KFRg7G0hC6uJQXTfbeLI9CgsJy0C5QuIPlQkJKcqnaNTL02OmcwOZbxfhwNMtE0jJ_aWVtl5mzSstkERO6mX7G4nM"
              />
              <span>Google Institutional Login</span>
            </button>
          </div>

          {/* Footer Link */}
          <div className="mt-10 text-center">
            <p className="text-gray-600 text-xs">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-blue-600 font-bold hover:underline ml-1">
                Request Membership
              </Link>
            </p>
          </div>
        </div>

        {/* System Status Bar */}
        <div className="mt-8 flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">NSE/BSE Operational</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">IST {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
          </div>
        </div>
      </main>

      {/* Decorative Corner Visual */}
      <div className="absolute bottom-10 right-10 hidden xl:block opacity-40">
        <div className="relative w-64 h-64">
          <div className="absolute inset-0 bg-gray-100 rounded-lg rotate-12 border border-gray-200"></div>
          <div className="absolute inset-0 bg-white rounded-lg -rotate-6 shadow-xl border border-gray-100 p-6 flex flex-col justify-between">
            <div className="h-2 w-12 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-green-100 rounded-full"></div>
              <div className="h-3 w-3/4 bg-gray-100 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
