import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, checkConnection } from '../utils/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError } from '../utils/firebase';
import { Expense, UserProfile, SavingsChallenge, SplitBill } from '../utils/storage';
import { getUserProfile, isGuestMode } from '../utils/firebaseUtils';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  expenses: Expense[];
  splitBills: SplitBill[];
  savingsChallenges: SavingsChallenge[];
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signOutGoogle: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isGuest: boolean;
  signInAsGuest: () => void;
  leaveGuestMode: () => void;
}

const FirebaseContext = createContext<FirebaseContextType>({} as FirebaseContextType);

// Helper enum for errors
enum OperationType { LIST = 'list' }

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splitBills, setSplitBills] = useState<SplitBill[]>([]);
  const [savingsChallenges, setSavingsChallenges] = useState<SavingsChallenge[]>([]);

  const loadGuestData = () => {
    setProfile(JSON.parse(localStorage.getItem('guest_profile') || 'null'));
    setExpenses(JSON.parse(localStorage.getItem('guest_expenses') || '[]'));
    setSplitBills(JSON.parse(localStorage.getItem('guest_splitBills') || '[]'));
    setSavingsChallenges(JSON.parse(localStorage.getItem('guest_challenges') || '[]'));
    setUser({ uid: 'guest', email: 'guest@rupiahku.local', displayName: 'Tamu', emailVerified: true } as any);
  };

  useEffect(() => {
    checkConnection();
    
    if (isGuestMode()) {
        setIsGuest(true);
        loadGuestData();
        setLoading(false);
        const onGuestDataChange = () => loadGuestData();
        window.addEventListener('guest_data_changed', onGuestDataChange);
        return () => window.removeEventListener('guest_data_changed', onGuestDataChange);
    }
    
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch profile
        const p = await getUserProfile(u.uid);
        if (p) {
          setProfile(p);
        } else {
          setProfile(null);
        }
        if (loading) setLoading(false);
      } else {
        setProfile(null);
        setExpenses([]);
        setSplitBills([]);
        setSavingsChallenges([]);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  const refreshProfile = async () => {
    if (isGuest) {
      loadGuestData();
      return;
    }
    if (user) {
        const p = await getUserProfile(user.uid);
        if (p) setProfile(p);
    }
  }

  useEffect(() => {
    if (!user || isGuest) return;

    const pathExp = `users/${user.uid}/expenses`;
    const qExp = query(collection(db, 'users', user.uid, 'expenses'), orderBy('createdAt', 'desc'));
    const unsubExp = onSnapshot(qExp, (snap) => {
      const validDocs = snap.docs.filter(d => d.data().userId === user.uid);
      setExpenses(validDocs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
      if(loading) setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, pathExp);
    });

    const pathBills = `users/${user.uid}/splitBills`;
    const qBills = query(collection(db, 'users', user.uid, 'splitBills'), orderBy('createdAt', 'desc'));
    const unsubBills = onSnapshot(qBills, (snap) => {
      const validDocs = snap.docs.filter(d => d.data().userId === user.uid);
      setSplitBills(validDocs.map(doc => ({ id: doc.id, ...doc.data() } as SplitBill)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, pathBills);
    });

    const pathChal = `users/${user.uid}/savingsChallenges`;
    const qChal = query(collection(db, 'users', user.uid, 'savingsChallenges'), orderBy('createdAt', 'desc'));
    const unsubChal = onSnapshot(qChal, (snap) => {
      const validDocs = snap.docs.filter(d => d.data().userId === user.uid);
      setSavingsChallenges(validDocs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsChallenge)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, pathChal);
    });

    return () => {
      unsubExp();
      unsubBills();
      unsubChal();
    };
  }, [user, isGuest]);

  const signInAsGuest = () => {
    localStorage.setItem('guestMode', 'true');
    window.location.reload();
  };

  const leaveGuestMode = () => {
    localStorage.removeItem('guestMode');
    localStorage.removeItem('guest_profile');
    localStorage.removeItem('guest_expenses');
    localStorage.removeItem('guest_splitBills');
    localStorage.removeItem('guest_challenges');
    window.location.reload();
  };

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const signOutGoogle = async () => {
    if (isGuest) {
      leaveGuestMode();
    } else {
      await auth.signOut();
    }
  };

  return (
    <FirebaseContext.Provider value={{
      user, loading, profile, expenses, splitBills, savingsChallenges, signIn, signInWithEmail, signUpWithEmail, signOutGoogle, refreshProfile, isGuest, signInAsGuest, leaveGuestMode
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext);

