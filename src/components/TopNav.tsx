'use client';

import { useSession, signOut } from '@/components/AuthContext';

export default function TopNav() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10">
      <div className="flex justify-between items-center px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-600">
              NSE/BSE Operational
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-600">
            IST {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {session && (
            <>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{session.user.email}</div>
                <div className="text-xs text-gray-500">Institutional Account</div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
