import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// 🔥 AMBIL DARI ENVIRONMENT VARIABLES (FALLBACK KE OLD VALUES KALAU DEV)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD0j6DCUBPM6HYIcdIBDm6lGtVidrXNugk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'vibe-code-project-495517.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'vibe-code-project-495517',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'vibe-code-project-495517.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '738721027160',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:738721027160:web:937cd4988757add0cda62d',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || 'ai-studio-c84db11d-bf3d-48b8-b333-bc17be78d807',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// 🛡️ VALIDASI: Jangan sampe API Key kosong
if (!firebaseConfig.apiKey) {
  console.error('❌ VITE_FIREBASE_API_KEY tidak ditemukan!');
  console.error(' Set di Vercel Dashboard: Settings > Environment Variables');
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth(app);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isAuthError = typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'permission-denied';
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  if (import.meta.env.DEV) {
    // Only log in DEV
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  
  if (isAuthError) {
    throw new Error("Sesi lo udah habis. Silakan login ulang.");
  } else {
    throw new Error("Gagal menyimpan data. Cek koneksi internet lo.");
  }
}

// Global connection state
let _isConnected = false;
let _connectionChecked = false;

export async function checkConnection() {
  if (_connectionChecked) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    _isConnected = true;
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. You are offline.");
    } else if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      // Permission denied implies we connected, but hit the safety net (which is correct)
      _isConnected = true;
    }
  }
  _connectionChecked = true;
}

export const googleProvider = new GoogleAuthProvider();
