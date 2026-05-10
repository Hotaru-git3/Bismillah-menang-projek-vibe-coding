import { collection, doc, setDoc, getDoc, getDocs, onSnapshot, query, orderBy, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError } from './firebase';
import { Expense, UserProfile, SavingsChallenge, SplitBill } from './storage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function isGuestMode() {
  return localStorage.getItem('guestMode') === 'true';
}

export function getActiveUser() {
  if (isGuestMode()) {
    return { uid: 'guest', email: '', displayName: 'Tamu' };
  }
  return auth.currentUser;
}

export function dispatchGuestUpdate() {
  window.dispatchEvent(new Event('guest_data_changed'));
}

export async function syncUserProfile(profile: UserProfile): Promise<void> {
  const user = getActiveUser();
  if (!user) return;
  if (isGuestMode()) {
    localStorage.setItem('guest_profile', JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }));
    dispatchGuestUpdate();
    return;
  }
  const path = `users/${user.uid}`;
  try {
    const docRef = doc(db, 'users', user.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, {
        name: profile.name,
        monthlyBudget: profile.monthlyBudget,
        badges: profile.badges || [],
        latestSummary: profile.latestSummary || null,
        latestRecurring: profile.latestRecurring || null,
        savedSummaries: profile.savedSummaries || null,
        savedRecurring: profile.savedRecurring || null,
        latestRoast: profile.latestRoast || null,
        latestProjection: profile.latestProjection || null,
        savedProjections: profile.savedProjections || null,
        savedRoasts: profile.savedRoasts || null,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        name: profile.name,
        email: user.email || '',
        monthlyBudget: profile.monthlyBudget,
        badges: profile.badges || [],
        latestSummary: profile.latestSummary || null,
        latestRecurring: profile.latestRecurring || null,
        savedSummaries: profile.savedSummaries || null,
        savedRecurring: profile.savedRecurring || null,
        latestRoast: profile.latestRoast || null,
        latestProjection: profile.latestProjection || null,
        savedProjections: profile.savedProjections || null,
        savedRoasts: profile.savedRoasts || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (isGuestMode()) {
    const p = localStorage.getItem('guest_profile');
    return p ? JSON.parse(p) : null;
  }
  const path = `users/${uid}`;
  try {
    const d = await getDoc(doc(db, 'users', uid));
    if (d.exists()) {
      return d.data() as UserProfile;
    }
  } catch(error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
}

export async function addExpenseToFirestore(expense: Omit<Expense, 'id' | 'date'> & { id: string; date: string }) {
  const user = getActiveUser();
  if (!user) return;
  if (isGuestMode()) {
    const list = JSON.parse(localStorage.getItem('guest_expenses') || '[]');
    list.unshift({ ...expense, userId: user.uid, createdAt: new Date().toISOString() });
    localStorage.setItem('guest_expenses', JSON.stringify(list));
    dispatchGuestUpdate();
    return;
  }
  const path = `users/${user.uid}/expenses/${expense.id}`;
  try {
    const docData: any = {
      userId: user.uid,
      amount: expense.amount,
      text: expense.text,
      category: expense.category,
      date: expense.date,
      createdAt: serverTimestamp()
    };
    if (expense.mood) docData.mood = expense.mood;
    if (expense.splitBillId) docData.splitBillId = expense.splitBillId;
    
    await setDoc(doc(db, 'users', user.uid, 'expenses', expense.id), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateExpenseInFirestore(id: string, updates: Partial<Expense>) {
  const user = getActiveUser();
  if (!user) return;
  if (isGuestMode()) {
    const list = JSON.parse(localStorage.getItem('guest_expenses') || '[]');
    const idx = list.findIndex((e: any) => e.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem('guest_expenses', JSON.stringify(list));
      dispatchGuestUpdate();
    }
    return;
  }
  const path = `users/${user.uid}/expenses/${id}`;
  try {
    const validUpdates: any = {};
    if (updates.text !== undefined) validUpdates.text = updates.text;
    if (updates.amount !== undefined) validUpdates.amount = updates.amount;
    if (updates.category !== undefined) validUpdates.category = updates.category;
    if (updates.mood !== undefined) validUpdates.mood = updates.mood;
    
    await updateDoc(doc(db, 'users', user.uid, 'expenses', id), validUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteExpenseFromFirestore(id: string) {
  const user = getActiveUser();
  if (!user) return;
  if (isGuestMode()) {
    let list = JSON.parse(localStorage.getItem('guest_expenses') || '[]');
    list = list.filter((e: any) => e.id !== id);
    localStorage.setItem('guest_expenses', JSON.stringify(list));
    dispatchGuestUpdate();
    return;
  }
  const path = `users/${user.uid}/expenses/${id}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addSplitBillToFirestore(bill: SplitBill) {
  const user = getActiveUser();
  if (!user) return;
  if (isGuestMode()) {
    const list = JSON.parse(localStorage.getItem('guest_splitBills') || '[]');
    list.unshift({ ...bill, userId: user.uid, createdAt: new Date().toISOString() });
    localStorage.setItem('guest_splitBills', JSON.stringify(list));
    dispatchGuestUpdate();
    return;
  }
  const path = `users/${user.uid}/splitBills/${bill.id}`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'splitBills', bill.id), {
      userId: user.uid,
      text: bill.text,
      originalAmount: bill.originalAmount,
      date: bill.date,
      friends: bill.friends || [],
      createdAt: serverTimestamp()
    });
  } catch(error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSplitBillFromFirestore(id: string) {
  const user = getActiveUser();
  if (!user) return;
  if (isGuestMode()) {
    const list = JSON.parse(localStorage.getItem('guest_splitBills') || '[]');
    const newList = list.filter((b: any) => b.id !== id);
    localStorage.setItem('guest_splitBills', JSON.stringify(newList));
    dispatchGuestUpdate();
    return;
  }
  const path = `users/${user.uid}/splitBills/${id}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'splitBills', id));
  } catch(error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addChallengeToFirestore(challenge: SavingsChallenge) {
  const user = getActiveUser();
  if (!user) return;
  if (isGuestMode()) {
    const list = JSON.parse(localStorage.getItem('guest_challenges') || '[]');
    list.unshift({ ...challenge, userId: user.uid, createdAt: new Date().toISOString() });
    localStorage.setItem('guest_challenges', JSON.stringify(list));
    dispatchGuestUpdate();
    return;
  }
  const path = `users/${user.uid}/savingsChallenges/${challenge.id}`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'savingsChallenges', challenge.id), {
      userId: user.uid,
      text: challenge.text,
      dateAssigned: challenge.dateAssigned,
      completed: challenge.completed,
      targetAmount: challenge.targetAmount,
      progressAmount: challenge.progressAmount,
      createdAt: serverTimestamp()
    });
  } catch(error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateChallengeInFirestore(id: string, updates: Partial<SavingsChallenge>) {
    const user = getActiveUser();
    if (!user) return;
    if (isGuestMode()) {
      const list = JSON.parse(localStorage.getItem('guest_challenges') || '[]');
      const idx = list.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem('guest_challenges', JSON.stringify(list));
        dispatchGuestUpdate();
      }
      return;
    }
    const path = `users/${user.uid}/savingsChallenges/${id}`;
    try {
        const validUpdates: any = {};
        if (updates.completed !== undefined) validUpdates.completed = updates.completed;
        if (updates.progressAmount !== undefined) validUpdates.progressAmount = updates.progressAmount;
        await updateDoc(doc(db, 'users', user.uid, 'savingsChallenges', id), validUpdates);
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
    }
}

