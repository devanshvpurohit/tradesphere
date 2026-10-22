import { NextRequest } from 'next/server';
import { adminAuth } from './admin';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  isDemo?: boolean;
}

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  // 1. Check Bearer token in Authorization header
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Check cookies
  if (!token) {
    token = request.cookies.get('firebase_token')?.value || null;
  }

  const demoCookie = request.cookies.get('demo_user_id')?.value;
  const demoHeader = request.headers.get('x-demo-user-id');
  const demoId = demoHeader || demoCookie;

  // If there's an actual Firebase ID token and Admin is available, verify it
  if (token && adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      return {
        id: decoded.uid,
        email: decoded.email || `${decoded.uid}@tradesphere.app`,
        name: decoded.name,
      };
    } catch (err) {
      // If token verification fails (e.g. invalid or expired), let's check if it's a demo or client token
      console.warn('ID token verification failed:', err);
    }
  }

  // Check if header passed a client UID or demo user
  const clientUid = request.headers.get('x-user-id') || request.cookies.get('tradesphere_uid')?.value;
  const clientEmail = request.headers.get('x-user-email') || request.cookies.get('tradesphere_email')?.value;

  if (clientUid) {
    return {
      id: clientUid,
      email: clientEmail || `${clientUid}@tradesphere.app`,
      isDemo: clientUid.startsWith('demo_'),
    };
  }

  if (demoId) {
    return {
      id: demoId,
      email: `${demoId}@demo.tradesphere.app`,
      name: 'Institutional Demo Trader',
      isDemo: true,
    };
  }

  return null;
}
