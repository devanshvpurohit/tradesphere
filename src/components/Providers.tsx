'use client';

import { AuthProvider } from '@/components/AuthContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" richColors theme="dark" closeButton />
    </AuthProvider>
  );
}
