// src/services/geminiService.ts
import { Expense } from '../utils/storage';
import { ParsedExpense } from './geminiServiceTypes';

const API_BASE = '/api/gemini';

async function callGeminiAPI(action: string, payload: any) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

function sanitizeInput(text: string): string {
  if (!text) return '';
  let sanitized = text.replace(/<[^>]*>?/gm, '');
  return sanitized;
}

export async function parseReceiptImage(fileBase64: string, mimeType: string): Promise<string> {
  try {
    const data = await callGeminiAPI('parseReceiptImage', { fileBase64, mimeType });
    return data.text?.trim() || '';
  } catch (e: any) {
    console.error('Gemini Error:', e);
    throw new Error('AI-nya lagi sibuk, coba lagi sebentar ya 🙏');
  }
}

export async function parseExpenseText(rawText: string): Promise<ParsedExpense> {
  try {
    const text = sanitizeInput(rawText);
    const parsed = await callGeminiAPI('parseExpenseText', { text });

    if (!['Makanan', 'Transport', 'Belanja', 'Hiburan', 'Lainnya', 'Kebutuhan', 'Investasi', 'Keinginan'].includes(parsed.category)) {
      parsed.category = 'Lainnya';
    }

    if (typeof parsed.amount !== 'number' || parsed.amount < 1 || parsed.amount > 100000000) {
      throw new Error('Input tidak valid. Coba lagi dengan format pengeluaran normal ya!');
    }

    return parsed;
  } catch (e: any) {
    console.error('Gemini Error:', e);
    if (e.message?.includes('Input tidak valid')) throw e;
    throw new Error('AI-nya lagi sibuk, coba lagi sebentar ya 🙏');
  }
}

export async function generateWeeklySummary(expenses: Expense[]): Promise<{ summary: string; topCategories: string[]; tip: string }> {
  try {
    const recentExpenses = expenses.slice(0, 30).map(e => ({ item: e.text, amount: e.amount, category: e.category, date: e.date }));
    const parsed = await callGeminiAPI('generateWeeklySummary', { expenses: recentExpenses });
    if (!parsed.summary) return { summary: 'Belum ada rangkuman', topCategories: [], tip: '' };
    if (!parsed.topCategories) parsed.topCategories = [];
    return parsed;
  } catch (e: any) {
    console.error('Gemini Error:', e);
    return { summary: 'Belum ada rangkuman', topCategories: [], tip: '' };
  }
}

export async function generateSavingsChallenge(expenses: Expense[]): Promise<{ text: string; targetAmount: number }> {
  try {
    const recentExpenses = expenses.slice(0, 30).map(e => ({ item: e.text, amount: e.amount, category: e.category }));
    const parsed = await callGeminiAPI('generateSavingsChallenge', { expenses: recentExpenses });
    if (!parsed.text) return { text: 'Gagal membuat challenge', targetAmount: 0 };
    return parsed;
  } catch (e: any) {
    console.error('Gemini Error:', e);
    return { text: 'Gagal membuat challenge', targetAmount: 0 };
  }
}

export async function detectRecurringExpense(expenses: Expense[]): Promise<{ detected: boolean; text: string; projection6Months: number } | null> {
  try {
    const recentExpenses = expenses.slice(0, 50).map(e => ({ item: e.text, amount: e.amount, date: e.date }));
    const parsed = await callGeminiAPI('detectRecurringExpense', { expenses: recentExpenses });
    if (parsed && !parsed.text) return null;
    return parsed;
  } catch (e: any) {
    console.error('Gemini Error:', e);
    return null;
  }
}

export async function generateMicroLesson(expenses: Expense[]): Promise<{ title: string; content: string; question: string; correctAnswer: string; options: string[] }> {
  try {
    const recentExpenses = expenses.slice(0, 30).map(e => ({ item: e.text, amount: e.amount, category: e.category }));
    const parsed = await callGeminiAPI('generateMicroLesson', { expenses: recentExpenses });
    if (!parsed.title) return { title: 'Gagal memuat materi', content: '', question: '', correctAnswer: '', options: [] };
    if (!parsed.options) parsed.options = [];
    return parsed;
  } catch (e: any) {
    console.error('Gemini Error:', e);
    return { title: 'Gagal memuat materi', content: '', question: '', correctAnswer: '', options: [] };
  }
}

export async function generateAuraRoast(expenses: Expense[]): Promise<{ aura: string; characterTitle: string; roast: string }> {
  try {
    const recentExpenses = expenses.slice(0, 40).map((e: any) => ({ item: e.text, amount: e.amount, category: e.category, mood: e.mood }));
    const parsed = await callGeminiAPI('generateAuraRoast', { expenses: recentExpenses });
    if (!parsed.aura) return { aura: 'Abu-abu', characterTitle: 'Si Error', roast: 'Aduh, AI lagi error nih.' };
    return parsed;
  } catch (e: any) {
    console.error('Gemini Error:', e);
    return { aura: 'Abu-abu', characterTitle: 'Si Error', roast: 'Aduh, AI lagi error nih.' };
  }
}

export async function generateProyeksi(expenses: Expense[]): Promise<{
  latteFactor: { items: string[]; yearlyCost: number; equivalentText: string };
  investmentMachine: { currentMonthly: number; projected1Y: number; projected3Y: number; projected5Y: number; encouragement: string };
}> {
  try {
    const allExpenses = expenses.map(e => ({ item: e.text, amount: e.amount, category: e.category, date: e.date }));
    const parsed = await callGeminiAPI('generateProyeksi', { expenses: allExpenses });
    if (!parsed.latteFactor || !parsed.investmentMachine) {
      return {
        latteFactor: { items: [], yearlyCost: 0, equivalentText: '' },
        investmentMachine: { currentMonthly: 0, projected1Y: 0, projected3Y: 0, projected5Y: 0, encouragement: '' }
      };
    }
    if (!parsed.latteFactor.items) parsed.latteFactor.items = [];
    return parsed;
  } catch (e: any) {
    console.error('Gemini Error:', e);
    return {
      latteFactor: { items: [], yearlyCost: 0, equivalentText: '' },
      investmentMachine: { currentMonthly: 0, projected1Y: 0, projected3Y: 0, projected5Y: 0, encouragement: '' }
    };
  }
}