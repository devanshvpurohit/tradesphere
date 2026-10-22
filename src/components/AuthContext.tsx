'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/client';
import { isFirebaseConfigured } from '@/lib/firebase/config';

export interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDemo?: boolean;
}

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: AppUser | null;
  status: SessionStatus;
  isConfigured: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInDemo: () => Promise<void>;
  signOut: (options?: { callbackUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const configured = isFirebaseConfigured();

  useEffect(() => {
    // Check if there is an active Demo user in localStorage or cookies
    const demoId = localStorage.getItem('tradesphere_demo_id');
    const demoEmail = localStorage.getItem('tradesphere_demo_email') || 'demotrader@tradesphere.app';

    if (demoId) {
      setUser({
        id: demoId,
        email: demoEmail,
        displayName: localStorage.getItem('tradesphere_demo_name') || 'Institutional Demo Trader',
        photoURL: null,
        isDemo: true,
      });
      setCookie('tradesphere_uid', demoId);
      setCookie('tradesphere_email', demoEmail);
      setStatus('authenticated');
      return;
    }

    if (!auth || !configured) {
      setStatus('unauthenticated');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          setCookie('firebase_token', token);
          setCookie('tradesphere_uid', fbUser.uid);
          setCookie('tradesphere_email', fbUser.email || '');

          setUser({
            id: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Trader',
            photoURL: fbUser.photoURL,
            isDemo: false,
          });
          setStatus('authenticated');
        } catch (e) {
          console.error('Error fetching auth token:', e);
          setStatus('unauthenticated');
        }
      } else {
        if (!localStorage.getItem('tradesphere_demo_id')) {
          removeCookie('firebase_token');
          removeCookie('tradesphere_uid');
          removeCookie('tradesphere_email');
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    });

    return () => unsubscribe();
  }, [configured]);

  const signInWithEmail = async (email: string, pass: string) => {
    // If user hasn't added real Firebase API Key yet, provide seamless instant demo login
    if (!configured || !auth) {
      const demoId = 'email_demo_' + Math.random().toString(36).substring(2, 8);
      const name = email.split('@')[0];
      localStorage.setItem('tradesphere_demo_id', demoId);
      localStorage.setItem('tradesphere_demo_email', email);
      localStorage.setItem('tradesphere_demo_name', name);
      setCookie('tradesphere_uid', demoId);
      setCookie('tradesphere_email', email);
      setCookie('demo_user_id', demoId);

      setUser({
        id: demoId,
        email,
        displayName: name,
        photoURL: null,
        isDemo: true,
      });
      setStatus('authenticated');
      return { success: true };
    }

    try {
      localStorage.removeItem('tradesphere_demo_id');
      localStorage.removeItem('tradesphere_demo_email');
      localStorage.removeItem('tradesphere_demo_name');
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const token = await res.user.getIdToken();
      setCookie('firebase_token', token);
      setCookie('tradesphere_uid', res.user.uid);
      setCookie('tradesphere_email', res.user.email || '');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to sign in' };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    // If user hasn't added real Firebase API Key yet, provide seamless instant demo registration
    if (!configured || !auth) {
      const demoId = 'trader_' + Math.random().toString(36).substring(2, 8);
      const displayName = name || email.split('@')[0];
      localStorage.setItem('tradesphere_demo_id', demoId);
      localStorage.setItem('tradesphere_demo_email', email);
      localStorage.setItem('tradesphere_demo_name', displayName);
      setCookie('tradesphere_uid', demoId);
      setCookie('tradesphere_email', email);
      setCookie('demo_user_id', demoId);

      setUser({
        id: demoId,
        email,
        displayName,
        photoURL: null,
        isDemo: true,
      });
      setStatus('authenticated');
      return { success: true };
    }

    try {
      localStorage.removeItem('tradesphere_demo_id');
      localStorage.removeItem('tradesphere_demo_email');
      localStorage.removeItem('tradesphere_demo_name');
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && res.user) {
        await updateProfile(res.user, { displayName: name });
      }
      const token = await res.user.getIdToken();
      setCookie('firebase_token', token);
      setCookie('tradesphere_uid', res.user.uid);
      setCookie('tradesphere_email', res.user.email || '');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to register account' };
    }
  };

  const signInWithGoogle = async () => {
    // If real Firebase key is not yet in .env.local, log in as Demo Google Trader without broken popup
    if (!configured || !auth || !googleProvider) {
      const demoId = 'google_demo_' + Math.random().toString(36).substring(2, 8);
      const demoEmail = 'dev7anshvpurohit@gmail.com';
      const demoName = 'Devansh Purohit (Google Demo)';
      localStorage.setItem('tradesphere_demo_id', demoId);
      localStorage.setItem('tradesphere_demo_email', demoEmail);
      localStorage.setItem('tradesphere_demo_name', demoName);
      setCookie('tradesphere_uid', demoId);
      setCookie('tradesphere_email', demoEmail);
      setCookie('demo_user_id', demoId);

      setUser({
        id: demoId,
        email: demoEmail,
        displayName: demoName,
        photoURL: null,
        isDemo: true,
      });
      setStatus('authenticated');
      return { success: true };
    }

    try {
      localStorage.removeItem('tradesphere_demo_id');
      localStorage.removeItem('tradesphere_demo_email');
      localStorage.removeItem('tradesphere_demo_name');
      const res = await signInWithPopup(auth, googleProvider);
      const token = await res.user.getIdToken();
      setCookie('firebase_token', token);
      setCookie('tradesphere_uid', res.user.uid);
      setCookie('tradesphere_email', res.user.email || '');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google authentication cancelled or failed.' };
    }
  };

  const signInDemo = async () => {
    const demoId = 'demo_trader_' + Math.random().toString(36).substring(2, 8);
    const demoEmail = 'pro-trader@tradesphere.demo';
    const demoName = 'Institutional Demo Trader';
    localStorage.setItem('tradesphere_demo_id', demoId);
    localStorage.setItem('tradesphere_demo_email', demoEmail);
    localStorage.setItem('tradesphere_demo_name', demoName);
    setCookie('tradesphere_uid', demoId);
    setCookie('tradesphere_email', demoEmail);
    setCookie('demo_user_id', demoId);

    setUser({
      id: demoId,
      email: demoEmail,
      displayName: demoName,
      photoURL: null,
      isDemo: true,
    });
    setStatus('authenticated');
  };

  const signOut = async (options?: { callbackUrl?: string }) => {
    try {
      localStorage.removeItem('tradesphere_demo_id');
      localStorage.removeItem('tradesphere_demo_email');
      localStorage.removeItem('tradesphere_demo_name');
      removeCookie('firebase_token');
      removeCookie('tradesphere_uid');
      removeCookie('tradesphere_email');
      removeCookie('demo_user_id');

      if (auth && auth.currentUser) {
        await firebaseSignOut(auth);
      }
      setUser(null);
      setStatus('unauthenticated');

      if (options?.callbackUrl) {
        window.location.href = options.callbackUrl;
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isConfigured: configured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSession must be used within an AuthProvider');
  }
  return {
    data: context.user ? { user: context.user } : null,
    status: context.status,
    isConfigured: context.isConfigured,
    signInWithEmail: context.signInWithEmail,
    signUpWithEmail: context.signUpWithEmail,
    signInWithGoogle: context.signInWithGoogle,
    signInDemo: context.signInDemo,
    signOut: context.signOut,
  };
}

export function signOut(options?: { callbackUrl?: string }) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tradesphere_demo_id');
    localStorage.removeItem('tradesphere_demo_email');
    localStorage.removeItem('tradesphere_demo_name');
    document.cookie = 'tradesphere_uid=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'firebase_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'demo_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    window.location.href = options?.callbackUrl || '/auth/signin';
  }
}
