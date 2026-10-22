import * as admin from 'firebase-admin';

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n');
}

export function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'tradesphere-demo';

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Fallback initialize with project ID for emulators / development
  try {
    return admin.initializeApp({
      projectId,
    });
  } catch (err) {
    console.warn('Firebase admin initialization warning:', err);
    return null;
  }
}

export const adminApp = initFirebaseAdmin();
export const adminAuth = adminApp ? admin.auth(adminApp) : null;
export const adminDb = adminApp ? admin.firestore(adminApp) : null;
