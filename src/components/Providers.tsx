'use client';

import { AuthProvider } from '@/components/AuthContext';
import { Toaster } from 'sonner';
import { AICopilot } from '@/components/copilot/AICopilot';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <AICopilot />
      <Toaster position="top-right" richColors theme="dark" closeButton />
    </AuthProvider>
  );
}
