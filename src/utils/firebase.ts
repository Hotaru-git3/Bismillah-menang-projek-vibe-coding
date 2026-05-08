import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

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
