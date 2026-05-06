export const STORAGE_KEYS = {
  PROFILE: 'rupiahku_user_profile',
  EXPENSES: 'rupiahku_expenses',
  CHALLENGES: 'rupiahku_challenges',
  LESSONS: 'rupiahku_lessons',
  SPLIT_BILLS: 'rupiahku_split_bills',
};

export interface UserProfile {
  name: string;
  monthlyBudget: number;
  concern: string;
  badges?: string[];
}

export type ExpenseCategory = 'Kebutuhan' | 'Investasi' | 'Keinginan';

export interface Expense {
  id: string;
  amount: number;
  text: string;
  category: ExpenseCategory;
  date: string;
  mood?: string;
  splitBillId?: string;
}

export interface SplitBill {
  id: string;
  originalAmount: number;
  text: string;
  date: string;
  friends: { name: string; amount: number; paid: boolean }[];
}

export interface SavingsChallenge {
  id: string;
  text: string;
  dateAssigned: string;
  completed: boolean;
  targetAmount: number;
  progressAmount: number;
}

export function getProfile(): UserProfile | null {
  const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
  return data ? JSON.parse(data) : null;
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export function getExpenses(): Expense[] {
  const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
  return data ? JSON.parse(data) : [];
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

export function addExpense(expense: Omit<Expense, 'id' | 'date'>): Expense {
  const expenses = getExpenses();
  const newExpense: Expense = {
    ...expense,
    id: Math.random().toString(36).substring(2, 9),
    date: new Date().toISOString()
  };
  expenses.unshift(newExpense);
  saveExpenses(expenses);
  return newExpense;
}

export function updateExpense(id: string, updates: Partial<Expense>): void {
  const expenses = getExpenses();
  const index = expenses.findIndex(e => e.id === id);
  if (index !== -1) {
    expenses[index] = { ...expenses[index], ...updates };
    saveExpenses(expenses);
  }
}

export function deleteExpense(id: string): void {
  const expenses = getExpenses();
  saveExpenses(expenses.filter(e => e.id !== id));
}

export function getSplitBills(): SplitBill[] {
  const data = localStorage.getItem(STORAGE_KEYS.SPLIT_BILLS);
  return data ? JSON.parse(data) : [];
}

export function saveSplitBills(bills: SplitBill[]): void {
  localStorage.setItem(STORAGE_KEYS.SPLIT_BILLS, JSON.stringify(bills));
}

export function getSavingsChallenge(): SavingsChallenge | null {
  const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
  return data ? JSON.parse(data) : null;
}

export function saveSavingsChallenge(challenge: SavingsChallenge): void {
  localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenge));
}
