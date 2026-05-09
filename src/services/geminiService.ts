import { ParsedExpense, WeeklySummary, SavingsChallenge, RecurringExpense, MicroLesson, AuraRoast, Proyeksi } from '../types/api';

async function callAPI<T>(action: string, payload: any): Promise<T> {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Gagal menghubungi server');
  }

  return data.result as T;
}

export async function parseReceiptImage(fileBase64: string, mimeType: string): Promise<string> {
  return callAPI<string>('parseReceiptImage', { fileBase64, mimeType });
}

export async function parseExpenseText(rawText: string): Promise<ParsedExpense> {
  return callAPI<ParsedExpense>('parseExpenseText', { rawText });
}

export async function generateWeeklySummary(expenses: any[]): Promise<WeeklySummary> {
  return callAPI<WeeklySummary>('generateWeeklySummary', { expenses });
}

export async function generateAuraRoast(expenses: any[]): Promise<AuraRoast> {
  return callAPI<AuraRoast>('generateAuraRoast', { expenses });
}

export async function generateProyeksi(expenses: any[]): Promise<Proyeksi> {
  return callAPI<Proyeksi>('generateProyeksi', { expenses });
}

export async function detectRecurringExpense(expenses: any[]): Promise<RecurringExpense> {
  return callAPI<RecurringExpense>('detectRecurringExpense', { expenses });
}

export async function generateMicroLesson(expenses: any[]): Promise<MicroLesson> {
  return callAPI<MicroLesson>('generateMicroLesson', { expenses });
}

export async function generateSavingsChallenge(expenses: any[]): Promise<SavingsChallenge> {
  return callAPI<SavingsChallenge>('generateSavingsChallenge', { expenses });
}
