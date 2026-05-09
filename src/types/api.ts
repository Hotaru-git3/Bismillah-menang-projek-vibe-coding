export interface ParsedExpense {
  amount: number;
  category: CategoryType;
  text: string;
  nudge: string;
  splitBill?: SplitBill;
}

export type CategoryType = 
  | 'Makanan & Minuman'
  | 'Transportasi'
  | 'Hiburan'
  | 'Belanja & Fashion'
  | 'Olahraga & Kebugaran'
  | 'Kesehatan & Kebutuhan Pokok'
  | 'Keuangan & Investasi'
  | 'Pendidikan'
  | 'Pulsa, Tagihan & Topup Digital'
  | 'Lainnya';

export interface SplitBill {
  totalAmount: number;
  myShare: number;
  friendNames: string[];
}

export interface WeeklySummary {
  summary: string;
  topCategories: string[];
  tip: string;
}

export interface SavingsChallenge {
  text: string;
  targetAmount: number;
}

export interface RecurringExpense {
  detected: boolean;
  text: string;
  projection6Months: number;
}

export interface MicroLesson {
  title: string;
  content: string;
  question: string;
  correctAnswer: string;
  options: string[];
}

export interface AuraRoast {
  aura: string;
  characterTitle: string;
  roast: string;
}

export interface Proyeksi {
  latteFactor: {
    items: string[];
    yearlyCost: number;
    equivalentText: string;
  };
  investmentMachine: {
    currentMonthly: number;
    projected1Y: number;
    projected3Y: number;
    projected5Y: number;
    encouragement: string;
  };
}

export interface APIRequest {
  action: string;
  payload: any;
}

export interface APIError {
  error: string;
  code?: string;
  retryAfter?: number;
}
