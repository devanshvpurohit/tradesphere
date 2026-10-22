import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { firebaseConfig, isFirebaseConfigured } from './config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let rtdb: Database | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let analytics: Analytics | null = null;

if (typeof window !== 'undefined' || isFirebaseConfigured()) {
  try {
    const config = isFirebaseConfigured()
      ? firebaseConfig
      : {
          apiKey: firebaseConfig.apiKey || 'AIzaSyDU3LCWY-fFm1feclfuJtZf1hf7HV41UXI',
          authDomain: 'tradesphere-37a5c.firebaseapp.com',
          databaseURL: firebaseConfig.databaseURL || 'https://tradesphere-37a5c-default-rtdb.firebaseio.com',
          projectId: 'tradesphere-37a5c',
          storageBucket: 'tradesphere-37a5c.firebasestorage.app',
          messagingSenderId: '682007896565',
          appId: firebaseConfig.appId || '1:682007896565:web:94ea52e6428a2c5d7940bc',
          measurementId: 'G-6YTX1X810B',
        };

    app = getApps().length > 0 ? getApp() : initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    try {
      rtdb = getDatabase(app);
    } catch {
      // Realtime Database optional init
    }
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    if (typeof window !== 'undefined' && config.measurementId) {
      isSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      });
    }
  } catch (error) {
    console.warn('Firebase client initialization warning:', error);
  }
}

export { app, auth, db, rtdb, googleProvider, analytics };
